export const multipleSelectedLocationDisplayText = (locations: string[], locationIdNameMap: Record<string, string>): string => {
  if (locations.length === 1) {
    return locationIdNameMap[locations[0]]
  } else if (locations.length > 1) {
    return `${locationIdNameMap[locations[0]]} + ${locations.length - 1} more`
  }
  return ''
}