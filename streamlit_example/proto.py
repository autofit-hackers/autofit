import streamlit as st

from apps import flexibility_app, prototype_app, pose_app, make_session_app
from utils import MultiApp


def main():
    app = MultiApp()

    # Add all your application here
    app.add_app("Prototype", prototype_app.app)
    app.add_app("Pose Main", pose_app.app)
    app.add_app("Make Session", make_session_app.app)
    app.add_app("Flexibility", flexibility_app.app)

    # The main app
    app.run()


if __name__ == "__main__":
    main()
