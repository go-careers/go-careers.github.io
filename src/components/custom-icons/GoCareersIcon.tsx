interface GoCareersIconProps {
  size?: number,
  background?: string
}

const GoCareersIcon = ({
  size = 20,
  background = 'yellow'
}: GoCareersIconProps) => {
  return (
    <div style={{
      paddingRight: '0.24em',
      fontFamily: 'Barlow Condensed',
      fontStyle: 'italic',
      textAlign: 'center',
      fontWeight: '900',
      textShadow: 'rgba(211, 47, 35, 0.42) 3.38244px 3.04556px 0px',
      textTransform: 'uppercase',
      position: 'absolute',
      overflow: 'visible',
      lineHeight: '0.89em',
      background: background,
      fontSize: size
    }}>
      GO
      <br/>
      CAREERS
    </div>
  )
}

export default GoCareersIcon