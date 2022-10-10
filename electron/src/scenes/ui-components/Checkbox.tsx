import filledCheckbox from '../../../resources/images/checkbox-filled.svg';
import emptyCheckbox from '../../../resources/images/checkbox-unfilled.svg';

export default function Checkbox(props: { isChecked: boolean; text: string }) {
  const { isChecked, text } = props;
  const textStyle = {
    fontFamily: 'Roboto',
    fontSize: '200%',
    fontWeight: '600',
    lineHeight: '100px',
    letterSpacing: '0.5px',
    TextAlign: 'left',
  };
  const imageStyle = {
    display: 'inline',
    paddingRight: '5%',
  };
  const checkboxSrc = isChecked ? filledCheckbox : emptyCheckbox;

  return (
    <p style={textStyle}>
      <img src={checkboxSrc} alt="Icon" style={imageStyle} />
      {text}
    </p>
  );
}
