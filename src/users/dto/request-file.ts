import {
  FileSystemStoredFile,
  HasMimeType,
  IsFile,
  MaxFileSize,
  MemoryStoredFile,
} from 'nestjs-form-data';

export class FormDataTestDto {
  @IsFile()
  @MaxFileSize(1e6)
  @HasMimeType(['image/webp', 'image/png'])
  avatar: MemoryStoredFile;
}
