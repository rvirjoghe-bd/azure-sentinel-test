export interface Event extends Record<string, unknown> {
    module: string;
    data: {
        [key: string]: string|number
    }
}

export interface BlobData {
    [streamName: string]: Event[]
}

