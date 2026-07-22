import { Injectable, BadRequestException } from '@nestjs/common'
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'
import { Readable } from 'stream'

export interface CloudinaryUploadResult {
    url: string
    secureUrl: string
    publicId: string
    format: string
    width: number
    height: number
}

@Injectable()
export class CloudinaryService {
    constructor() {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        })
    }

    async uploadImage(
        file: Express.Multer.File,
        folder = 'transfers',
    ): Promise<CloudinaryUploadResult> {
        if (!file || !file.buffer) {
            throw new BadRequestException('No file provided or file buffer is empty')
        }

        const result = await new Promise<UploadApiResponse>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder,
                    resource_type: 'image',
                },
                (error, result) => {
                    if (error) return reject(error)
                    resolve(result!)
                },
            )

            // Pipe the file buffer into the upload stream
            const readable = Readable.from(file.buffer)
            readable.pipe(uploadStream)
        })

        return this.mapResult(result)
    }

    async uploadMultiple(
        files: Express.Multer.File[],
        folder = 'transfers',
    ): Promise<CloudinaryUploadResult[]> {
        if (!files || files.length === 0) {
            throw new BadRequestException('No files provided')
        }

        return Promise.all(
            files.map(file => this.uploadImage(file, folder)),
        )
    }

    async uploadMultipleAndGetUrls(
        files: Express.Multer.File[],
        folder = 'transfers',
    ): Promise<string[]> {
        const results = await this.uploadMultiple(files, folder)
        return results.map(r => r.secureUrl)
    }

    async deleteImage(publicId: string) {
        return cloudinary.uploader.destroy(publicId)
    }

    async deleteMultiple(publicIds: string[]) {
        return cloudinary.api.delete_resources(publicIds)
    }

    private mapResult(result: UploadApiResponse): CloudinaryUploadResult {
        return {
            url: result.url,
            secureUrl: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
        }
    }
}