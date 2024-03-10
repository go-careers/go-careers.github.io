import '../../../styles/styles.scss'

interface SideFilterProps {
  filterTitle: string;
  options: Array<{
    id: string;
    displayText?: string;
  }>;
  selectedOption?: string;
  updateSelection: (selection?: string) => void;
  maxSelection?: number;
}

const SideFilter = ({
  options,
  filterTitle,
  selectedOption,
  updateSelection
}: SideFilterProps) => {

  // TODO: Currently supports single selection, extend it to support multi select.
  const handleSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked){
      updateSelection(event.target.id)
    } else {
      updateSelection(undefined)
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
              checked={selectedOption === option.id}
              className="job-style"
            />
            <label htmlFor={option.id}>{option.displayText ?? option.id}</label>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SideFilter