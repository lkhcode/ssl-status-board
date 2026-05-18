// Team logo utilities
const knownLogos = new Set([
  '浙江大学',
  '浙江广厦建设职业技术大学',
  '宁波大学',
  '宁波工程学院',
  '浙江工商大学',
  '浙江水利水电学院',
  '浙大城市学院',
  '温州职业技术学院',
  '浙大宁波理工学院',
  '湖州师范大学',
  '浙江纺织服装职业技术学院',
  'zjunlict',
])

export const getTeamLogoUrl = (teamName: string): string => {
  const normalizedTeamName = teamName.trim().toLowerCase()

  for (const logoName of knownLogos) {
    if (normalizedTeamName.includes(logoName.toLowerCase())) {
      // Use URL import for dynamic loading that works with Vite
      return new URL(`../assets/logos/${logoName}.png`, import.meta.url).href
    }
  }

  // Return default logo
  return new URL('../assets/logos/no-logo.png', import.meta.url).href
}
