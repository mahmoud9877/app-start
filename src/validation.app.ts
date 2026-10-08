import { ArgumentMetadata, Injectable, PipeTransform } from "@nestjs/common";


@Injectable()
export class VaildationCalss implements PipeTransform {
    transform(value: any, metadata: ArgumentMetadata) {
    }
}