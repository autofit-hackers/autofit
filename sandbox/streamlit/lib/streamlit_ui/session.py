import json

import streamlit as st


def load_session_meta_data() -> bool:
    st.markdown("---")
    st.subheader("Session Meta Data")
    session_meta_json = st.file_uploader("Choose Session meta file (.json)", type="json")
    if "session_meta" in st.session_state:
        session_meta = st.session_state["session_meta"]
        st.write(session_meta)
        return True
    else:
        session_meta = dict()
        if session_meta_json:
            session_meta = json.load(session_meta_json)
            st.session_state["session_meta"] = session_meta
            st.write(session_meta)
        return False
