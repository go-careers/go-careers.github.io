import { useEffect, useState } from 'react'
import { SideFilterPropOption } from '../components/filters/common/SideFilter'
import { getAllLocations } from '../utils/ApiUtils'

export const useJobLocations = () => {
  const [locationOptions, setLocationOptions] = useState<SideFilterPropOption[]>()
  const [locationIdNameMap, setLocationIdNameMap] = useState<Record<string, string>>({})

  useEffect(() => { 
    getAllLocations()
      // Sort locations based on counter value.
      .then((data) => data.data.sort((location1, location2) => location2.counter - location1.counter))
      .then((locations) => {
        setLocationOptions([])
        locations.forEach((location) => {
          const locationDisplayText = `${location.city}, ${location.state}, ${location.country}`
          setLocationIdNameMap((prevMap) => ({
            ...prevMap,
            [location.id]: locationDisplayText
          }))
          setLocationOptions((existingLocations) => [...(existingLocations ?? []), {
            id: location.id,
            displayText: locationDisplayText
          }])
        })})
      .catch((error) => {
        console.error(error)
        setLocationOptions(undefined)
      })
  }, [])

  return {
    locationOptions,
    locationIdNameMap
  }
}