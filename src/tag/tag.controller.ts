import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { TagService } from './tag.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('tags')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  // CREATE
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateTagDto) {
    return this.tagService.create(dto);
  }

  // GET ALL
  @Get()
  findAll() {
    return this.tagService.findAll();
  }

  // GET MAIN TAGS
  @Get('main')
  findMain() {
    return this.tagService.findMain();
  }

  // UPDATE
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTagDto) {
    return this.tagService.update(id, dto);
  }

  // DELETE
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tagService.remove(id);
  }
}