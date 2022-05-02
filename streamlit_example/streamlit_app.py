import streamlit as st

from apps import calibration_app  # import your app modules here
from apps import get_physical_info_app, make_session_app, pose3d_reconstruction, pose_app, visualize_pose
from utils import MultiApp


def main():
    app = MultiApp()

    # Add all your application here
    app.add_app("Make Session", make_session_app.app)
    app.add_app("Calibration", calibration_app.app)
    app.add_app("Pose", pose_app.app)
    app.add_app("Get physical info", get_physical_info_app.app)
    app.add_app("Reconstruct 3D Pose", pose3d_reconstruction.app)
    app.add_app("Vizualize pose", visualize_pose.app)
    # TODO: pkl編集画面を立てる

    # The main app
    app.run()


if __name__ == "__main__":
    main()
