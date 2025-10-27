package board

import (
	"fmt"
	"log"
	"net"
	"net/http"
	"runtime"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"golang.org/x/net/ipv4"
)

// MulticastServer handles UDP multicast reception
type MulticastServer struct {
	Consumer func([]byte, *net.UDPAddr)
	conn     *net.UDPConn
	addr     string
}

// NewMulticastServer creates a new multicast server
func NewMulticastServer(addr string) *MulticastServer {
	return &MulticastServer{addr: addr}
}

// Start starts listening for multicast packets
func (m *MulticastServer) Start() {
	udpAddr, err := net.ResolveUDPAddr("udp4", m.addr)
	if err != nil {
		log.Println("ResolveUDPAddr error:", err)
		return
	}

	var conn *net.UDPConn
	if runtime.GOOS == "windows" {
		// Windows: bind to 0.0.0.0 and join multicast group
		conn, err = net.ListenUDP("udp4", &net.UDPAddr{IP: net.IPv4zero, Port: udpAddr.Port})
		if err != nil {
			log.Println("ListenUDP error:", err)
			return
		}
		pconn := ipv4.NewPacketConn(conn)
		err = pconn.JoinGroup(nil, &net.UDPAddr{IP: udpAddr.IP, Port: udpAddr.Port})
		if err != nil {
			log.Println("JoinGroup error:", err)
			conn.Close()
			return
		}
		log.Printf("Joined multicast group %s on Windows", udpAddr.IP)
	} else {
		// Linux/others: use ListenMulticastUDP
		conn, err = net.ListenMulticastUDP("udp4", nil, udpAddr)
		if err != nil {
			log.Println("ListenMulticastUDP error:", err)
			return
		}
		log.Printf("Listening on multicast %s", m.addr)
	}

	m.conn = conn

	go func() {
		buf := make([]byte, 65536)
		for {
			n, src, err := conn.ReadFromUDP(buf)
			if err != nil {
				log.Println("ReadFromUDP error:", err)
				return
			}
			if m.Consumer != nil {
				m.Consumer(buf[:n], src)
			}
		}
	}()
}

// Stop stops the multicast server
func (m *MulticastServer) Stop() {
	if m.conn != nil {
		m.conn.Close()
	}
}

// Board contains the state of this referee board
type Board struct {
	cfg             RefereeConfig
	refereeData     []byte
	mutex           sync.Mutex
	MulticastServer *MulticastServer
	numClients      int
}

// NewBoard creates a new referee board
func NewBoard(cfg RefereeConfig) (b *Board) {
	b = new(Board)
	b.cfg = cfg
	b.MulticastServer = NewMulticastServer(b.cfg.MulticastAddress)
	b.MulticastServer.Consumer = b.handlingMessage
	return
}

// Start listening for messages
func (b *Board) Start() {
	b.MulticastServer.Start()
}

// Stop listening for messages
func (b *Board) Stop() {
	b.MulticastServer.Stop()
}

func (b *Board) handlingMessage(data []byte, _ *net.UDPAddr) {
	b.mutex.Lock()
	defer b.mutex.Unlock()
	b.refereeData = data
}

// SendToWebSocket sends latest data to the given websocket
func (b *Board) SendToWebSocket(conn *websocket.Conn) {
	b.mutex.Lock()
	b.numClients++
	b.mutex.Unlock()
	for b.SendRefereeData(conn) {
		time.Sleep(b.cfg.SendingInterval)
	}
	b.mutex.Lock()
	b.numClients--
	b.mutex.Unlock()
}

func (b *Board) SendRefereeData(conn *websocket.Conn) bool {
	b.mutex.Lock()
	data := b.refereeData
	b.mutex.Unlock()

	if len(data) == 0 {
		return true
	}

	if err := conn.SetWriteDeadline(time.Now().Add(time.Second)); err != nil {
		log.Println("Failed to set write deadline:", err)
		return false
	}
	if err := conn.WriteMessage(websocket.BinaryMessage, data); err != nil {
		log.Println("Could not write to referee websocket: ", err)
		return false
	}
	return true
}

// WsHandler handles referee websocket connections
func (b *Board) WsHandler(w http.ResponseWriter, r *http.Request) {
	WsHandler(w, r, b.SendToWebSocket)
}

// ClientsHandler handles clients api
func (b *Board) ClientsHandler(w http.ResponseWriter, _ *http.Request) {
	b.mutex.Lock()
	numClients := b.numClients
	b.mutex.Unlock()
	if _, err := fmt.Fprintf(w, "Connected clients: %v", numClients); err != nil {
		w.WriteHeader(500)
	}
}
