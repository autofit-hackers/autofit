/* eslint-disable */
import './loader.css';

interface LoaderProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

function Loader(props: LoaderProps) {
  return (
    <div className="wrapper" {...props}>
      <div className="spinner" />
      <p>{props.children}</p>
    </div>
  );
}

export default Loader;
