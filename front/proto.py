import streamlit as st

from apps import auto_app, flexibility_app, pose_visualization, prototype_app, pose_app, make_session_app
from utils import MultiApp


def main():
    app = MultiApp()

    # Add all your application here
    app.add_app("Auto", auto_app.app)
    app.add_app("Prototype", prototype_app.app)
    app.add_app("Visualize", pose_visualization.app)

    # The main app
    app.run()


if __name__ == "__main__":
    main()
