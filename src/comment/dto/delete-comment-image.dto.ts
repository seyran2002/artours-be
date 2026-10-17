import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteCommentImageDto {
    @IsString()
    @IsNotEmpty()
    imageUrl!: string;
}
