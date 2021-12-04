//
//  CameraView.swift
//  posefitMVP
//
//  Created by 遠藤聡志 on 2021/12/04.
//

import SwiftUI
 
struct CameraView: View {
    
    @State var imageData : Data = .init(capacity:0)
    @State var source:UIImagePickerController.SourceType = .photoLibrary
    
    @State var isActionSheet = false
    @State var isImagePicker = false
    
    var body: some View {
            NavigationView{
                VStack(spacing:0){
                        ZStack{
                            NavigationLink(
                                destination: Imagepicker(show: $isImagePicker, image: $imageData, sourceType: source),
                                isActive:$isImagePicker,
                                label: {
                                    Text("")
                                })
                            VStack{
                                if imageData.count != 0{
                                    Image(uiImage: UIImage(data: self.imageData)!)
                                        .resizable()
                                        .aspectRatio(contentMode: .fill)
                                        .frame(height: 250)
                                        .cornerRadius(15)
                                        .padding()
                                }
                                HStack(spacing:30){
                                    Button(action: {
                                            self.source = .photoLibrary
                                            self.isImagePicker.toggle()
                                    }, label: {
                                        Text("Upload")
                                    })
                                    Button(action: {
                                            self.source = .camera
                                            self.isImagePicker.toggle()
                                    }, label: {
                                        Text("Take Photo")
                                    })
                                }
                            }
                        }
                }
                .navigationBarTitle("Home", displayMode: .inline)
            }
        .ignoresSafeArea(.all, edges: .top)
        .background(Color.primary.opacity(0.06).ignoresSafeArea(.all, edges: .all))
    }
}

struct CameraView_Previews: PreviewProvider {
    static var previews: some View {
        CameraView()
    }
}
