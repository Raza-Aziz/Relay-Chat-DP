import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { convertBufferToBase64 } from './generic.js';


export const uploadFilesToCloudinary = async({files}:{files:Express.Multer.File[]})=>{
    try {
        const uploadPromises = files.map(file=>cloudinary.uploader.upload(file.path))
        const result = await Promise.all(uploadPromises)
        return result
    } catch (error) {
        console.log('Error uploading files to cloudinary');
        console.log(error);
    }
}

export const deleteFilesFromCloudinary = async({publicIds}:{publicIds:string[]}):Promise<any[] | undefined>=>{
    try {
        await cloudinary.uploader.destroy(publicIds[0])
        const deletePromises = publicIds.map(publicId=>cloudinary.uploader.destroy(publicId))
        const uploadResult = await Promise.all(deletePromises)
        return uploadResult
    } catch (error) {
        console.log('Error deleting files from cloudinary');
        console.log(error);
    }
}

export type AudioUploadFolder = 'encrypted-audio' | 'group-audio';

export const uploadAudioToCloudinary = async ({
    buffer, 
    folder = 'group-audio'
}: {
    buffer: Uint8Array<ArrayBuffer>,
    folder?: AudioUploadFolder
}): Promise<UploadApiResponse | undefined> => {
    try {
      const base64Audio = `data:audio/webm;base64,${convertBufferToBase64(buffer)}`;
      const uploadResult = await cloudinary.uploader.upload(base64Audio, {
        resource_type: "raw",
        folder,
      });
      return uploadResult as UploadApiResponse;
    } catch (error) {
      console.error(`Error uploading audio to Cloudinary (${folder}):`, error);
    }
};