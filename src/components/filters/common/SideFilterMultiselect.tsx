import '../../../styles/styles.scss'
import { SideFilterPropOption } from './SideFilter'


export interface SideFilterMultiselectProps {
  filterTitle: string;
  options: SideFilterPropOption[];
  selectedOptions?: string[];
  updateSelection: React.Dispatch<React.SetStateAction<string[]>>
}

const SideFilterMultiselect = ({
  options,
  filterTitle,
  selectedOptions,
  updateSelection
}: SideFilterMultiselectProps) => {
  // TODO: Currently supports single selection, extend it to support multi select.
  const handleSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked && !selectedOptions?.includes(event.target.id)){
      updateSelection((prevSelection) => [...prevSelection, event.target.id])
    } else {
      updateSelection((prevSelection) => prevSelection.filter((value) => value != event.target.id))
    }
  }

  return (
    <div className="job-time">
      <div className="job-time-title">{filterTitle}</div>
      <div className="job-wrapper">
        {options.map((option, index) => (
          <div className="type-container" key={index}>
            <input 
              id={option.id}
              type="checkbox"
              onChange={(event) => handleSelection(event)}
              checked={selectedOptions?.includes(option.id)}
              className="job-style"
            />
            <label htmlFor={option.id}>{option.displayText ?? option.id}</label>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SideFilterMultiselect