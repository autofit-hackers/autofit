import streamlit as st


def reload_button_ui() -> bool:
    if st.button("RELOAD"):
        to_reload = True
        st.write("RELOADED")
    else:
        to_reload = False
    return to_reload
