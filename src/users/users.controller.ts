import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
// @UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener lista de usuarios' })
  @ApiResponse({
    status: 200,
    description: 'Operación exitosa',
  })
  @Get()
  getUsers(): Promise<User[]> {
    return this.usersService.findAll();
  }
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener usuario por id' })
  @ApiResponse({
    status: 200,
    description: 'Operación exitosa',
  })
  @Get(':id')
  getUser(@Param('id') id: string): Promise<User | null> {
    return this.usersService.findById(id);
  }
  @ApiBearerAuth()
  @ApiOperation({ summary: 'crear un nuevo usuario' })
  @Post()
  @UseGuards(JwtAuthGuard)
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'actualizar usuario por id' })
  @ApiResponse({
    status: 201,
    description: 'Operación exitosa',
  })
  @Put(':id')
  updateUser(
    @Param('id') id: string,
    @Body() user: UpdateUserDto,
  ): Promise<User | null> {
    return this.usersService.update(id, user);
  }
  @ApiBearerAuth()
  @ApiOperation({ summary: 'desactivar usuario por id' })
  @ApiResponse({
    status: 201,
    description: 'Operación exitosa',
  })
  @Patch(':id/status')
  updateUserStatus(@Param('id') id: string): Promise<User | null> {
    return this.usersService.updateStatus(id);
  }
  @ApiBearerAuth()
  @ApiOperation({ summary: 'eliminar usuario por id' })
  @ApiResponse({
    status: 201,
    description: 'Operación exitosa',
  })
  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.usersService.deleteById(id);
  }
}
