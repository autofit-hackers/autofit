"""
# ref. https://plotly.com/python/pca-visualization/
"""
import json
from typing import Dict, List, Union
from pathlib import Path

import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from sklearn.decomposition import PCA
from frozendict import frozendict

from lib.streamlit_ui.setting_class import PoseLandmarksObject


class PosePCA:
    def __init__(self):
        pass

    def session_to_skeleton_path(self, json_path: Union[str, Path]) -> Path:
        """load a session file

        Args:
            json_path (Path): path to session_meta.json file

        Returns:
            Path: path to skeleton.json file
        """
        json_path = Path(json_path)
        assert json_path.exists() and json_path.is_file()
        with open(json_path, mode="r") as f:
            session_meta = json.load(f)
        user_info_path: Path = Path(session_meta["user_info_path"])
        return user_info_path / "skeleton.json"

    def load_skeleton(self, skeleton_path: Union[str, Path]) -> pd.DataFrame:
        """load skeleton.json as pandas dataframe

        Args:
            skeleton_path (Union[str, Path]): path-like object

        Returns:
            pd.DataFrame: dataframe of skeleton
        """
        skeleton_path = Path(skeleton_path)
        assert skeleton_path.is_file()
        with open(skeleton_path, mode="r") as f:
            # wrap value with list for DataFrame parser
            skeleton = pd.DataFrame({key: [float(value)] for key, value in json.load(f).items()})
        return skeleton

    def query(self, skeleton: Dict[str, float]) -> None:
        pass

    def load_dummy_data(self, n: int = 100):
        num_landmarks = 33
        dummy_skeletons: List[Dict[str, float]] = [
            PoseLandmarksObject(
                landmark=np.random.rand(num_landmarks, 3), visibility=np.ones((num_landmarks, 1)), timestamp=0.0
            ).get_bone_lengths()
            for _ in range(n)
        ]
        return pd.DataFrame(dummy_skeletons)

    def show_2d_pca(self, df: pd.DataFrame, query: pd.Series) -> None:
        pca = PCA(n_components=2, random_state=0)

        fitted_pca = pca.fit(df)
        components = fitted_pca.transform(df)
        pca_query = fitted_pca.transform(query)

        loadings = pca.components_.T * np.sqrt(pca.explained_variance_)  # type: ignore
        total_var: float = pca.explained_variance_ratio_.sum() * 100  # type: ignore

        components = pd.concat([pd.DataFrame.from_numpy(components), pca_query], axis=1)
        fig = px.scatter(components, x=0, y=1, title=f"Total Explained Variance: {total_var:.2f}%")
        print(pca_query.shape)
        print(type(pca_query[0][0]))
        # fig.add_trace(go.Scatter({"x": [pca_query[0][0]], "y": [pca_query[0][1]]}, x=0, y=1))

        for i, feature in enumerate(df.columns):
            fig.add_shape(type="line", x0=0, y0=0, x1=loadings[i, 0], y1=loadings[i, 1])
            fig.add_annotation(
                x=loadings[i, 0],
                y=loadings[i, 1],
                ax=0,
                ay=0,
                xanchor="center",
                yanchor="bottom",
                text=feature,
            )
        fig.show()


def main():
    pose_pca = PosePCA()
    query = pose_pca.load_skeleton("../data/skeleton.json")
    dummpy_data = pose_pca.load_dummy_data()
    pose_pca.show_2d_pca(dummpy_data, query)


if __name__ == "__main__":
    main()
