import streamlit as st

from apps import calibration_app, traial_app  # import your app modules here
from apps import (
    get_physical_info_app,
    make_session_app,
    pose3d_reconstruction,
    pose_app,
    pose_visualization,
    flexibility_app,
)
from utils import MultiApp


def main():
    app = MultiApp()

    # Add all your application here
    app.add_app("Make Session", make_session_app.app)
    app.add_app("Calibration", calibration_app.app)
    app.add_app("Pose", pose_app.app)
    app.add_app("Get physical info", get_physical_info_app.app)
    app.add_app("Reconstruct 3D Pose", pose3d_reconstruction.app)
    app.add_app("Visualize pose", pose_visualization.app)
    app.add_app("trial", traial_app.app)

    # The main app
    app.run()


if __name__ == "__main__":
    main()
