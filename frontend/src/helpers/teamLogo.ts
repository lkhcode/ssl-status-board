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
  'spbunited'
])

export const normalizeTeamName = (value: string): string =>
  value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e]/g, '')
    .replace(/\s+/g, '')
    .trim()

export const getTeamLogoUrl = (teamName: string): string => {
  const normalizedTeamName = normalizeTeamName(teamName)

  for (const logoName of knownLogos) {
    const normalizedLogoName = normalizeTeamName(logoName)
    if (normalizedTeamName.includes(normalizedLogoName)) {
      // Use URL import for dynamic loading that works with Vite
      return new URL(`../assets/logos/${logoName}.png`, import.meta.url).href
    }
  }

  // Return default logo
  return new URL('../assets/logos/no-logo.png', import.meta.url).href
}
