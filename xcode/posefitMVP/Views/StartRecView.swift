//
//  StartRecView.swift
//  posefitMVP
//
//  Created by 遠藤聡志 on 2021/12/04.
//

import SwiftUI

struct StartRecView: View {
    var body: some View {
        NavigationView(){
            NavigationLink(destination: CameraView()){
                Text("カメラを起動する")
            }
        }
        .navigationViewStyle(StackNavigationViewStyle())
    }
}

struct StartRecView_Previews: PreviewProvider {
    static var previews: some View {
        StartRecView()
    }
}
