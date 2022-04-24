import streamlit as st

from apps import calibration_app, pose_app  # import your app modules here
from utils.multiapp import MultiApp


def main():
    app = MultiApp()

    # Add all your application here
    app.add_app("Pose", pose_app.app)
    app.add_app("Calibration", calibration_app.app)

    # The main app
    app.run()


if __name__ == "__main__":
    main()
