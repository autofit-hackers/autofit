var NewComponent = React.createClass({
  render: function () {
    return (
      <div>
        <meta charSet="UTF-8" />
        <title>Kinect Azure Example</title>
        <link rel="stylesheet" href="../assets/vendors/bootstrap-4.3.1-dist/css/bootstrap.css" />
        <link rel="stylesheet" href="../assets/vendors/bootstrap-4.3.1-dist/css/docs.min.css" />
        <div className="d-flex align-items-baseline justify-content-between">
          <h1 className="bd-title">Body Tracking (2D)</h1>
          <button onclick="require('electron').remote.getCurrentWebContents().openDevTools()">open dev tools</button>
        </div>
        <p>This demo shows the 2D Skeleton Information.</p>
        <canvas id="outputCanvas" className="img-fluid" />
        <div className="row">
          <div className="col col-auto">
            Renderer: <div id="statsRenderer" />
          </div>
          <div className="col col-auto">
            Kinect: <div id="statsKinect" />
          </div>
        </div>
      </div>
    );
  },
});
