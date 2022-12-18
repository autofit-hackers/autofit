function PoseGridView(props: {
  gridDivRef: React.MutableRefObject<HTMLDivElement | null>;
  style: React.CSSProperties;
}) {
  const { gridDivRef, style } = props;

  return (
    <div className="square-box" style={style}>
      <div
        className="pose-grid-container"
        ref={gridDivRef}
        style={{
          position: 'relative',
          height: '100%',
          width: '100%',
          top: 0,
          left: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
      />
    </div>
  );
}

export default PoseGridView;
