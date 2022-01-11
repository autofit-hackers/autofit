//
//  posefitMVPApp.swift
//  posefitMVP
//
//  Created by Yusuke Kondo on 2021/11/29.
//

import SwiftUI

@main
struct posefitMVPApp: App {
//    let persistenceController = PersistenceController.shared

    var body: some Scene {
        WindowGroup {
            CameraView()
//            StartRecView()
//                .environment(\.managedObjectContext, persistenceController.container.viewContext)
        }
    }
}
