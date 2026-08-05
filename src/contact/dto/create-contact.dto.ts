import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateContactDto {
    @IsNotEmpty({ message: 'Name is required' })
    @IsString()
    name: string;

    @IsNotEmpty({ message: 'Phone number is required' })
    @IsString()
    phone: string;

    @IsNotEmpty({ message: 'Message is required' })
    @IsString()
    @MinLength(10, { message: 'Message must be at least 10 characters long' })
    message: string;
}
