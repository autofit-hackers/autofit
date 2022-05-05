"""
# ref. https://plotly.com/python/pca-visualization/
"""
from multiprocessing import dummy
from typing import Dict, List

import numpy as np
import pandas as pd
import plotly.express as px
from sklearn.decomposition import PCA

from class_objects import PoseLandmarksObject


class PosePCA:
    def __init__(self):
        pass

    def load_data(self):
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

    def show_2d_pca(self, df: pd.DataFrame) -> None:
        pca = PCA(n_components=2, random_state=0)
        components = pca.fit_transform(df)

        loadings = pca.components_.T * np.sqrt(pca.explained_variance_)  # type: ignore
        total_var: float = pca.explained_variance_ratio_.sum() * 100  # type: ignore

        fig = px.scatter(components, x=0, y=1, title=f"Total Explained Variance: {total_var:.2f}%")

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
    dummpy_data = pose_pca.load_dummy_data()
    pose_pca.show_2d_pca(dummpy_data)


if __name__ == "__main__":
    main()
