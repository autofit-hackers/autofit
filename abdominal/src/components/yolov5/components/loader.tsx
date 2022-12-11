import '../style/loader.css';

function Loader(props) {
  return (
    <div className="wrapper" {...props}>
      <div className="spinner" />
      <p>{props.children}</p>
    </div>
  );
}

export default Loader;
