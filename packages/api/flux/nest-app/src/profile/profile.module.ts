import {Module} from '@nestjs/common';
import {UserSchema} from "@n/user/schemas/user.schema";
import {MongooseModule} from '@nestjs/mongoose';
import {ProfileService} from './profile.service';
import {ProfileController} from './profile/profile.controller';

@Module({
    imports: [MongooseModule.forFeature([{name: 'User', schema: UserSchema}])],
    providers: [ProfileService],
    controllers: [ProfileController],
})
export class ProfileModule {
}
