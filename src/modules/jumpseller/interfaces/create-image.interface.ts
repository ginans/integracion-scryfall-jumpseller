export interface ICreateImageResponse {
    image: {
        id: number;
        position: number;
        url: string;
    };
}
export interface ICreateImageRequest {
    image: {
        url: string;
        position?: number;
    };
}