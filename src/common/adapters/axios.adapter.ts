import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios'
import { HttpAdapter } from '../interfaces/http-adapter.interface';
import {LoggerService} from "../logger/logger.service";

@Injectable()
export class AxiosAdapter implements HttpAdapter {
    private axios: AxiosInstance = axios;
    constructor(private readonly loggerService: LoggerService) {}
    async get<T>(url: string): Promise<T> {
        try {
            const { data } = await this.axios.get<T>( url );
            return data;

        } catch (error) {
            this.loggerService.error(error);
            throw new Error('This is an error - Check logs');
        }

    }
    async post<T>(url: string, body: any): Promise<T> {
        try {
            const { data } = await this.axios.post<T>( url, body );
            return data;

        } catch (error) {
            this.loggerService.error(error);
            throw new Error('This is an error - Check logs');
        }
    }
    async put<T>(url: string, body: any): Promise<T> {
        try {
            const { data } = await this.axios.put<T>( url, body );
            return data;

        } catch (error) {
            this.loggerService.error(error);
            throw new Error('This is an error - Check logs');
        }
    }
    async delete<T>(url: string): Promise<T> {
        try {
            const { data } = await this.axios.delete<T>( url );
            return data;

        } catch (error) {
            this.loggerService.error(error);
            throw new Error('This is an error - Check logs');
        }
    }

}