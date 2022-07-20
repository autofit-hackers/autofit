import pickle
import json

import numpy as np
import av

from lib.streamlit_ui.setting_class import PoseLandmarksObject


class PhysicalInfo:
    def __init__(self):
        pass

    def frame_to_physical_info(self, frame: av.VideoFrame):
        pass

    def _save_estimated_pose(self, obj, save_path) -> None:
        with open(save_path, "wb") as handle:
            pickle.dump(obj, handle, protocol=pickle.HIGHEST_PROTOCOL)

    def _save_bone_info(self, captured_skeleton: PoseLandmarksObject):
        print("save!!!")
        # TODO: この辺はutilsに連れて行く
        bone_edge_names = {
            "shoulder_width": (11, 12),
            "shin": (27, 25),
            "thigh": (25, 23),
            "full_leg": (27, 23),
            "pelvic_width": (23, 24),
            "flank": (23, 11),
            "upper_arm": (11, 13),
            "fore_arm": (13, 15),
            "full_arm": (11, 15),
        }

        bone_dict = {"foot_neck_height": self._calculate_height(captured_skeleton)}
        for bone_edge_key in bone_edge_names.keys():
            bone_dict[bone_edge_key] = np.linalg.norm(
                captured_skeleton.landmark[bone_edge_names[bone_edge_key][0]]
                - captured_skeleton.landmark[bone_edge_names[bone_edge_key][1]]
            )

        with open("data.json", "w") as fp:
            # TODO: data.json のパスをインスタンス変数化
            json.dump(bone_dict, fp)

    def _calculate_height(self, pose: PoseLandmarksObject):
        neck = (pose.landmark[11] + pose.landmark[12]) / 2
        foot_center = (pose.landmark[27] + pose.landmark[28]) / 2
        return np.linalg.norm(neck - foot_center)

    def _calculate_foot_position(self, pose: PoseLandmarksObject):
        return (pose.landmark[27] + pose.landmark[28]) / 2

    def recv(self, frame: av.VideoFrame) -> av.VideoFrame:

        # カメラキャプチャ #####################################################
        frame = frame.to_ndarray(format="bgr24")

        # TODO: ここで image に対して single camera calibration

        # 画像の保存
        # TODO: capture skeleton の rename or jsonの保存までするように関数書き換え
        if self.capture_skeleton and self.img_save_path:
            print(self.img_save_path)
            os.makedirs(os.path.dirname(self.img_save_path), exist_ok=True)
            cv2.imwrite(self.img_save_path, frame)
            self.capture_skeleton = False
