"""Frameworks for running multiple Streamlit applications as a single app.
"""
import streamlit as st


class MultiApp:
    """Framework for combining multiple streamlit applications.
    Usage:
        def foo():
            st.title("Hello Foo")
        def bar():
            st.title("Hello Bar")
        app = MultiApp()
        app.add_app("Foo", foo)
        app.add_app("Bar", bar)
        app.run()
    It is also possible keep each application in a separate file.
        import foo
        import bar
        app = MultiApp()
        app.add_app("Foo", foo.app)
        app.add_app("Bar", bar.app)
        app.run()
    """

    def __init__(self):
        self.apps = []

    def add_app(self, title, func):
        """Adds a new application.
        Parameters
        ----------
        func:
            the python function to render this app.
        title:
            title of the app. Appears in the dropdown in the sidebar.
        """
        self.apps.append({"title": title, "function": func})

    def run(self):
        # app = st.sidebar.radio("Go To", self.apps, format_func=lambda app: app["title"])

        if "page_index" in st.session_state:
            index = st.session_state["page_index"]
        else:
            index = 0
            st.session_state["page_index"] = 0
        if st.sidebar.button("next"):
            if index < len(self.apps) - 1:
                index += 1
            else:
                index = 0
            print(index)
            st.session_state["page_index"] = index
        app = st.sidebar.radio("Go To", self.apps, format_func=lambda app: app["title"], index=index)

        app["function"]()
