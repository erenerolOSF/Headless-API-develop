/* eslint-disable @typescript-eslint/no-explicit-any */
import { Query, Mutation, Resolver, Ctx, Args, Arg } from "type-graphql";
import { GraphQLContext, GraphQLDataSources } from "../../../types";
import { CheckoutDataArgs } from "./input";
import {
    CheckoutData,
    DateTimePickerData,
    SavedAddress,
    OrderData,
    OrderConfirmationData,
    DeliveryMethod,
    Order,
} from "./types";
import Cookies from "cookies";
import { CommerceError } from "../errors";
import { Basket } from "../basket/types";
import { toPrice } from "../basket/resolver";
import { OrderAddressInput } from "./input";

const dateTimePickerData: DateTimePickerData = {
    //todo make this dynamic later
    weekDaysTexts: ["Mo", "Tue", "We", "Th", "Fr", "Sa", "Su"],
    months: [
        {
            name: "March 2022",
            number: 3,
            year: 2022,
            isActive: true,
            days: [
                {
                    dayOfAWeek: 1,
                    id: 1,
                    isAvailable: true,
                    name: "Monday",
                    hours: [
                        {
                            period: "am",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-am",
                        },
                        {
                            period: "am",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-am",
                        },
                        {
                            period: "am",
                            name: "08:00 - 9:00",
                            isAvailable: false,
                            id: "8-9-am",
                        },
                        {
                            period: "am",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-am",
                        },
                        {
                            period: "am",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-am",
                        },
                        {
                            period: "am",
                            name: "11:00 - 12:00",
                            isAvailable: true,
                            id: "11-12-am",
                        },
                        {
                            period: "pm",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-pm",
                        },
                        {
                            period: "pm",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-pm",
                        },
                        {
                            period: "pm",
                            name: "08:00 - 9:00",
                            isAvailable: true,
                            id: "8-9-pm",
                        },
                        {
                            period: "pm",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-pm",
                        },
                        {
                            period: "pm",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-pm",
                        },
                        {
                            period: "pm",
                            name: "11:00 - 12:00",
                            isAvailable: true,
                            id: "11-12-pm",
                        },
                    ],
                },
                {
                    dayOfAWeek: 2,
                    id: 2,

                    isAvailable: true,
                    name: "Tuesday",
                    hours: [
                        {
                            period: "am",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-am",
                        },
                        {
                            period: "am",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-am",
                        },
                        {
                            period: "am",
                            name: "08:00 - 9:00",
                            isAvailable: false,
                            id: "8-9-am",
                        },
                        {
                            period: "am",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-am",
                        },
                        {
                            period: "am",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-am",
                        },
                        {
                            period: "am",
                            name: "11:00 - 12:00",
                            isAvailable: true,
                            id: "11-12-am",
                        },
                        {
                            period: "pm",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-pm",
                        },
                        {
                            period: "pm",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-pm",
                        },
                        {
                            period: "pm",
                            name: "08:00 - 9:00",
                            isAvailable: true,
                            id: "8-9-pm",
                        },
                        {
                            period: "pm",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-pm",
                        },
                        {
                            period: "pm",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-pm",
                        },
                        {
                            period: "pm",
                            name: "11:00 - 12:00",
                            isAvailable: true,
                            id: "11-12-pm",
                        },
                    ],
                },
                {
                    dayOfAWeek: 3,
                    id: 3,
                    isAvailable: true,
                    name: "Wednesday",
                    hours: [
                        {
                            period: "am",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-am",
                        },
                        {
                            period: "am",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-am",
                        },
                        {
                            period: "am",
                            name: "08:00 - 9:00",
                            isAvailable: false,
                            id: "8-9-am",
                        },
                        {
                            period: "am",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-am",
                        },
                        {
                            period: "am",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-am",
                        },
                        {
                            period: "am",
                            name: "11:00 - 12:00",
                            isAvailable: true,
                            id: "11-12-am",
                        },
                        {
                            period: "pm",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-pm",
                        },
                        {
                            period: "pm",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-pm",
                        },
                        {
                            period: "pm",
                            name: "08:00 - 9:00",
                            isAvailable: true,
                            id: "8-9-pm",
                        },
                        {
                            period: "pm",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-pm",
                        },
                        {
                            period: "pm",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-pm",
                        },
                        {
                            period: "pm",
                            name: "11:00 - 12:00",
                            isAvailable: true,
                            id: "11-12-pm",
                        },
                    ],
                },
                {
                    dayOfAWeek: 4,
                    id: 4,
                    isAvailable: true,
                    name: "Thursday",
                    hours: [
                        {
                            period: "am",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-am",
                        },
                        {
                            period: "am",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-am",
                        },
                        {
                            period: "am",
                            name: "08:00 - 9:00",
                            isAvailable: false,
                            id: "8-9-am",
                        },
                        {
                            period: "am",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-am",
                        },
                        {
                            period: "am",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-am",
                        },
                        {
                            period: "am",
                            name: "11:00 - 12:00",
                            isAvailable: true,
                            id: "11-12-am",
                        },
                        {
                            period: "pm",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-pm",
                        },
                        {
                            period: "pm",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-pm",
                        },
                        {
                            period: "pm",
                            name: "08:00 - 9:00",
                            isAvailable: true,
                            id: "8-9-pm",
                        },
                        {
                            period: "pm",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-pm",
                        },
                        {
                            period: "pm",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-pm",
                        },
                        {
                            period: "pm",
                            name: "11:00 - 12:00",
                            isAvailable: true,
                            id: "11-12-pm",
                        },
                    ],
                },
                {
                    dayOfAWeek: 5,
                    id: 5,
                    isAvailable: true,
                    name: "Friday",
                    hours: [
                        {
                            period: "am",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-am",
                        },
                        {
                            period: "am",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-am",
                        },
                        {
                            period: "am",
                            name: "08:00 - 9:00",
                            isAvailable: false,
                            id: "8-9-am",
                        },
                        {
                            period: "am",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-am",
                        },
                        {
                            period: "am",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-am",
                        },
                        {
                            period: "am",
                            name: "11:00 - 12:00",
                            isAvailable: true,
                            id: "11-12-am",
                        },
                        {
                            period: "pm",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-pm",
                        },
                        {
                            period: "pm",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-pm",
                        },
                        {
                            period: "pm",
                            name: "08:00 - 9:00",
                            isAvailable: true,
                            id: "8-9-pm",
                        },
                        {
                            period: "pm",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-pm",
                        },
                        {
                            period: "pm",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-pm",
                        },
                        {
                            period: "pm",
                            name: "11:00 - 12:00",
                            isAvailable: true,
                            id: "11-12-pm",
                        },
                    ],
                },
                {
                    dayOfAWeek: 6,
                    id: 6,
                    isAvailable: true,
                    name: "Saturday",
                    hours: [
                        {
                            period: "am",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-am",
                        },
                        {
                            period: "am",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-am",
                        },
                        {
                            period: "am",
                            name: "08:00 - 9:00",
                            isAvailable: false,
                            id: "8-9-am",
                        },
                        {
                            period: "am",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-am",
                        },
                        {
                            period: "am",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-am",
                        },
                        {
                            period: "am",
                            name: "11:00 - 12:00",
                            isAvailable: true,
                            id: "11-12-am",
                        },
                        {
                            period: "pm",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-pm",
                        },
                        {
                            period: "pm",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-pm",
                        },
                        {
                            period: "pm",
                            name: "08:00 - 9:00",
                            isAvailable: true,
                            id: "8-9-pm",
                        },
                        {
                            period: "pm",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-pm",
                        },
                        {
                            period: "pm",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-pm",
                        },
                        {
                            period: "pm",
                            name: "11:00 - 12:00",
                            isAvailable: true,
                            id: "11-12-pm",
                        },
                    ],
                },
                {
                    dayOfAWeek: 7,
                    id: 7,
                    isAvailable: true,
                    name: "Sunday",
                    hours: [
                        {
                            period: "am",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-am",
                        },
                        {
                            period: "am",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-am",
                        },
                        {
                            period: "am",
                            name: "08:00 - 9:00",
                            isAvailable: false,
                            id: "8-9-am",
                        },
                        {
                            period: "am",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-am",
                        },
                        {
                            period: "am",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-am",
                        },
                        {
                            period: "am",
                            name: "11:00 - 12:00",
                            isAvailable: true,
                            id: "11-12-am",
                        },
                        {
                            period: "pm",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-pm",
                        },
                        {
                            period: "pm",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-pm",
                        },
                        {
                            period: "pm",
                            name: "08:00 - 9:00",
                            isAvailable: true,
                            id: "8-9-pm",
                        },
                        {
                            period: "pm",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-pm",
                        },
                        {
                            period: "pm",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-pm",
                        },
                        {
                            period: "pm",
                            name: "11:00 - 12:00",
                            isAvailable: true,
                            id: "11-12-pm",
                        },
                    ],
                },
                {
                    dayOfAWeek: 1,
                    id: 8,
                    isAvailable: true,
                    name: "Monday",
                    hours: [
                        {
                            period: "am",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-am",
                        },
                        {
                            period: "am",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-am",
                        },
                        {
                            period: "am",
                            name: "08:00 - 9:00",
                            isAvailable: false,
                            id: "8-9-am",
                        },
                        {
                            period: "am",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-am",
                        },
                        {
                            period: "am",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-am",
                        },
                        {
                            period: "am",
                            name: "11:00 - 12:00",
                            isAvailable: true,
                            id: "11-12-am",
                        },
                        {
                            period: "pm",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-pm",
                        },
                        {
                            period: "pm",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-pm",
                        },
                        {
                            period: "pm",
                            name: "08:00 - 9:00",
                            isAvailable: true,
                            id: "8-9-pm",
                        },
                        {
                            period: "pm",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-pm",
                        },
                        {
                            period: "pm",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-pm",
                        },
                        {
                            period: "pm",
                            name: "11:00 - 12:00",
                            isAvailable: true,
                            id: "11-12-pm",
                        },
                    ],
                },
                {
                    dayOfAWeek: 2,
                    id: 9,
                    isAvailable: true,
                    name: "Tuesday",
                    hours: [
                        {
                            period: "am",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-am",
                        },
                        {
                            period: "am",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-am",
                        },
                        {
                            period: "am",
                            name: "08:00 - 9:00",
                            isAvailable: false,
                            id: "8-9-am",
                        },
                        {
                            period: "am",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-am",
                        },
                        {
                            period: "am",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-am",
                        },
                        {
                            period: "am",
                            name: "11:00 - 12:00",
                            isAvailable: true,
                            id: "11-12-am",
                        },
                        {
                            period: "pm",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-pm",
                        },
                        {
                            period: "pm",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-pm",
                        },
                        {
                            period: "pm",
                            name: "08:00 - 9:00",
                            isAvailable: true,
                            id: "8-9-pm",
                        },
                        {
                            period: "pm",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-pm",
                        },
                        {
                            period: "pm",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-pm",
                        },
                        {
                            period: "pm",
                            name: "11:00 - 12:00",
                            isAvailable: true,
                            id: "11-12-pm",
                        },
                    ],
                },
                {
                    dayOfAWeek: 3,
                    id: 10,
                    isAvailable: true,
                    name: "Wednesday",
                    hours: [
                        {
                            period: "am",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-am",
                        },
                        {
                            period: "am",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-am",
                        },
                        {
                            period: "am",
                            name: "08:00 - 9:00",
                            isAvailable: false,
                            id: "8-9-am",
                        },
                        {
                            period: "am",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-am",
                        },
                        {
                            period: "am",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-am",
                        },
                        {
                            period: "am",
                            name: "11:00 - 12:00",
                            isAvailable: true,
                            id: "11-12-am",
                        },
                        {
                            period: "pm",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-pm",
                        },
                        {
                            period: "pm",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-pm",
                        },
                        {
                            period: "pm",
                            name: "08:00 - 9:00",
                            isAvailable: true,
                            id: "8-9-pm",
                        },
                        {
                            period: "pm",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-pm",
                        },
                        {
                            period: "pm",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-pm",
                        },
                        {
                            period: "pm",
                            name: "11:00 - 12:00",
                            isAvailable: true,
                            id: "11-12-pm",
                        },
                    ],
                },
            ],
        },
        {
            name: "April 2022",
            number: 4,
            year: 2022,
            isActive: false,
            days: [
                {
                    dayOfAWeek: 4,
                    id: 1,
                    isAvailable: true,
                    name: "Thursday",
                    hours: [
                        {
                            period: "am",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-am",
                        },
                        {
                            period: "am",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-am",
                        },
                        {
                            period: "am",
                            name: "08:00 - 9:00",
                            isAvailable: false,
                            id: "8-9-am",
                        },
                        {
                            period: "am",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-am",
                        },
                        {
                            period: "am",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-am",
                        },
                        {
                            period: "am",
                            name: "11:00 - 12:00",
                            isAvailable: true,
                            id: "11-12-am",
                        },
                        {
                            period: "pm",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-pm",
                        },
                        {
                            period: "pm",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-pm",
                        },
                        {
                            period: "pm",
                            name: "08:00 - 9:00",
                            isAvailable: true,
                            id: "8-9-pm",
                        },
                        {
                            period: "pm",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-pm",
                        },
                        {
                            period: "pm",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-pm",
                        },
                        {
                            period: "pm",
                            name: "11:00 - 12:00",
                            isAvailable: true,
                            id: "11-12-pm",
                        },
                    ],
                },
                {
                    dayOfAWeek: 5,
                    id: 2,
                    isAvailable: true,
                    name: "Friday",
                    hours: [
                        {
                            period: "am",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-am",
                        },
                        {
                            period: "am",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-am",
                        },
                        {
                            period: "am",
                            name: "08:00 - 9:00",
                            isAvailable: false,
                            id: "8-9-am",
                        },
                        {
                            period: "am",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-am",
                        },
                        {
                            period: "am",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-am",
                        },
                        {
                            period: "am",
                            name: "11:00 - 12:00",
                            isAvailable: true,
                            id: "11-12-am",
                        },
                        {
                            period: "pm",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-pm",
                        },
                        {
                            period: "pm",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-pm",
                        },
                        {
                            period: "pm",
                            name: "08:00 - 9:00",
                            isAvailable: true,
                            id: "8-9-pm",
                        },
                        {
                            period: "pm",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-pm",
                        },
                        {
                            period: "pm",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-pm",
                        },
                        {
                            period: "pm",
                            name: "11:00 - 12:00",
                            isAvailable: true,
                            id: "11-12-pm",
                        },
                    ],
                },
                {
                    dayOfAWeek: 6,
                    id: 3,
                    isAvailable: true,
                    name: "Saturday",
                    hours: [
                        {
                            period: "am",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-am",
                        },
                        {
                            period: "am",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-am",
                        },
                        {
                            period: "am",
                            name: "08:00 - 9:00",
                            isAvailable: false,
                            id: "8-9-am",
                        },
                        {
                            period: "am",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-am",
                        },
                        {
                            period: "am",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-am",
                        },
                        {
                            period: "am",
                            name: "11:00 - 12:00",
                            isAvailable: true,
                            id: "11-12-am",
                        },
                        {
                            period: "pm",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-pm",
                        },
                        {
                            period: "pm",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-pm",
                        },
                        {
                            period: "pm",
                            name: "08:00 - 9:00",
                            isAvailable: true,
                            id: "8-9-pm",
                        },
                        {
                            period: "pm",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-pm",
                        },
                        {
                            period: "pm",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-pm",
                        },
                        {
                            period: "pm",
                            name: "11:00 - 12:00",
                            isAvailable: true,
                            id: "11-12-pm",
                        },
                    ],
                },
                {
                    dayOfAWeek: 7,
                    id: 4,
                    isAvailable: true,
                    name: "Sunday",
                    hours: [
                        {
                            period: "am",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-am",
                        },
                        {
                            period: "am",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-am",
                        },
                        {
                            period: "am",
                            name: "08:00 - 9:00",
                            isAvailable: false,
                            id: "8-9-am",
                        },
                        {
                            period: "am",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-am",
                        },
                        {
                            period: "am",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-am",
                        },
                        {
                            period: "am",
                            name: "11:00 - 12:00",
                            isAvailable: true,
                            id: "11-12-am",
                        },
                        {
                            period: "pm",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-pm",
                        },
                        {
                            period: "pm",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-pm",
                        },
                        {
                            period: "pm",
                            name: "08:00 - 9:00",
                            isAvailable: true,
                            id: "8-9-pm",
                        },
                        {
                            period: "pm",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-pm",
                        },
                        {
                            period: "pm",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-pm",
                        },
                        {
                            period: "pm",
                            name: "11:00 - 12:00",
                            isAvailable: true,
                            id: "11-12-pm",
                        },
                    ],
                },
                {
                    dayOfAWeek: 1,
                    id: 5,
                    isAvailable: true,
                    name: "Monday",
                    hours: [
                        {
                            period: "am",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-am",
                        },
                        {
                            period: "am",
                            name: "08:00 - 9:00",
                            isAvailable: false,
                            id: "8-9-am",
                        },
                        {
                            period: "am",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-am",
                        },
                        {
                            period: "am",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-am",
                        },
                        {
                            period: "am",
                            name: "11:00 - 12:00",
                            isAvailable: true,
                            id: "11-12-am",
                        },
                        {
                            period: "pm",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-pm",
                        },
                        {
                            period: "pm",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-pm",
                        },
                        {
                            period: "pm",
                            name: "08:00 - 9:00",
                            isAvailable: true,
                            id: "8-9-pm",
                        },
                        {
                            period: "pm",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-pm",
                        },
                        {
                            period: "pm",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-pm",
                        },
                    ],
                },
                {
                    dayOfAWeek: 2,
                    id: 6,
                    isAvailable: true,
                    name: "Tuesday",
                    hours: [
                        {
                            period: "am",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-am",
                        },
                        {
                            period: "am",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-am",
                        },
                        {
                            period: "am",
                            name: "08:00 - 9:00",
                            isAvailable: false,
                            id: "8-9-am",
                        },
                        {
                            period: "am",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-am",
                        },
                        {
                            period: "am",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-am",
                        },
                        {
                            period: "am",
                            name: "11:00 - 12:00",
                            isAvailable: true,
                            id: "11-12-am",
                        },
                        {
                            period: "pm",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-pm",
                        },
                        {
                            period: "pm",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-pm",
                        },
                        {
                            period: "pm",
                            name: "08:00 - 9:00",
                            isAvailable: true,
                            id: "8-9-pm",
                        },
                        {
                            period: "pm",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-pm",
                        },
                        {
                            period: "pm",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-pm",
                        },
                        {
                            period: "pm",
                            name: "11:00 - 12:00",
                            isAvailable: true,
                            id: "11-12-pm",
                        },
                    ],
                },
                {
                    dayOfAWeek: 3,
                    id: 7,
                    isAvailable: true,
                    name: "Wednesday",
                    hours: [
                        {
                            period: "am",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-am",
                        },
                        {
                            period: "am",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-am",
                        },
                        {
                            period: "am",
                            name: "08:00 - 9:00",
                            isAvailable: false,
                            id: "8-9-am",
                        },
                        {
                            period: "am",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-am",
                        },
                        {
                            period: "am",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-am",
                        },
                        {
                            period: "am",
                            name: "11:00 - 12:00",
                            isAvailable: true,
                            id: "11-12-am",
                        },
                        {
                            period: "pm",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-pm",
                        },
                        {
                            period: "pm",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-pm",
                        },
                        {
                            period: "pm",
                            name: "08:00 - 9:00",
                            isAvailable: true,
                            id: "8-9-pm",
                        },
                        {
                            period: "pm",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-pm",
                        },
                        {
                            period: "pm",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-pm",
                        },
                        {
                            period: "pm",
                            name: "11:00 - 12:00",
                            isAvailable: true,
                            id: "11-12-pm",
                        },
                    ],
                },
                {
                    dayOfAWeek: 4,
                    id: 8,
                    isAvailable: true,
                    name: "Thursday",
                    hours: [
                        {
                            period: "am",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-am",
                        },
                        {
                            period: "am",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-am",
                        },
                        {
                            period: "am",
                            name: "08:00 - 9:00",
                            isAvailable: false,
                            id: "8-9-am",
                        },
                        {
                            period: "am",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-am",
                        },
                        {
                            period: "am",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-am",
                        },
                        {
                            period: "am",
                            name: "11:00 - 12:00",
                            isAvailable: true,
                            id: "11-12-am",
                        },
                        {
                            period: "pm",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-pm",
                        },
                        {
                            period: "pm",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-pm",
                        },
                        {
                            period: "pm",
                            name: "08:00 - 9:00",
                            isAvailable: true,
                            id: "8-9-pm",
                        },
                        {
                            period: "pm",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-pm",
                        },
                        {
                            period: "pm",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-pm",
                        },
                        {
                            period: "pm",
                            name: "11:00 - 12:00",
                            isAvailable: true,
                            id: "11-12-pm",
                        },
                    ],
                },
                {
                    dayOfAWeek: 5,
                    id: 9,
                    isAvailable: true,
                    name: "Friday",
                    hours: [
                        {
                            period: "am",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-am",
                        },
                        {
                            period: "am",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-am",
                        },
                        {
                            period: "am",
                            name: "08:00 - 9:00",
                            isAvailable: false,
                            id: "8-9-am",
                        },
                        {
                            period: "am",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-am",
                        },
                        {
                            period: "am",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-am",
                        },
                        {
                            period: "am",
                            name: "11:00 - 12:00",
                            isAvailable: true,
                            id: "11-12-am",
                        },
                        {
                            period: "pm",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-pm",
                        },
                        {
                            period: "pm",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-pm",
                        },
                        {
                            period: "pm",
                            name: "08:00 - 9:00",
                            isAvailable: true,
                            id: "8-9-pm",
                        },
                        {
                            period: "pm",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-pm",
                        },
                    ],
                },
                {
                    dayOfAWeek: 6,
                    id: 10,
                    isAvailable: false,
                    name: "Saturday",
                    hours: [
                        {
                            period: "am",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-am",
                        },
                        {
                            period: "am",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-am",
                        },
                        {
                            period: "am",
                            name: "08:00 - 9:00",
                            isAvailable: false,
                            id: "8-9-am",
                        },
                        {
                            period: "am",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-am",
                        },
                        {
                            period: "am",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-am",
                        },
                        {
                            period: "am",
                            name: "11:00 - 12:00",
                            isAvailable: true,
                            id: "11-12-am",
                        },
                        {
                            period: "pm",
                            name: "06:00 - 7:00",
                            isAvailable: true,
                            id: "6-7-pm",
                        },
                        {
                            period: "pm",
                            name: "07:00 - 8:00",
                            isAvailable: false,
                            id: "7-8-pm",
                        },
                        {
                            period: "pm",
                            name: "08:00 - 9:00",
                            isAvailable: true,
                            id: "8-9-pm",
                        },
                        {
                            period: "pm",
                            name: "09:00 - 10:00",
                            isAvailable: true,
                            id: "9-10-pm",
                        },
                        {
                            period: "pm",
                            name: "10:00 - 11:00",
                            isAvailable: true,
                            id: "10-11-pm",
                        },
                        {
                            period: "pm",
                            name: "11:00 - 12:00",
                            isAvailable: true,
                            id: "11-12-pm",
                        },
                    ],
                },
            ],
        },
    ],
};

@Resolver()
export class CheckoutResolver {
    @Query(() => CheckoutData, { nullable: true })
    async getCheckoutData(
        @Args() { locale, siteId }: CheckoutDataArgs,
        @Ctx() { dataSources, user, req, res }: GraphQLContext & { dataSources: GraphQLDataSources }
    ) {
        const cookies = new Cookies(req, res, {
            keys: [process.env.COOKIES_SIGNATURE_KEY],
            secure: process.env.NODE_ENV !== "development" ? true : false,
        });

        const selectedStoreId = cookies.get("session.selectedStoreId", { signed: true });

        if (!selectedStoreId) {
            throw new CommerceError("No store selected.");
        }

        const storeRes = await dataSources.ocapi.getStoreById(selectedStoreId, siteId, user.accessToken);

        if (!storeRes) {
            throw new CommerceError("No store selected.");
        }

        const basketData = await dataSources.CommerceAPIDataSource.getCustomerBaskets(
            siteId,
            user.accessToken,
            user.customerId
        );

        if ("baskets" in basketData) {
            const { basketId, shipments, customerInfo, currency } = basketData.baskets[0];

            if (!basketId) {
                throw new CommerceError("No basket found", "BASKET_NOT_FOUND");
            }

            if (!shipments) {
                throw new CommerceError("No shipments found", "SHIPMENTS_NOT_FOUND");
            }

            const savedAddresses: SavedAddress[] = [];

            if ("customerNo" in customerInfo) {
                const customerProfileData = await dataSources.CommerceAPIDataSource.getUser(
                    siteId,
                    user.customerId,
                    user.accessToken
                );

                if ("addresses" in customerProfileData) {
                    customerProfileData.addresses.forEach((address: any) => {
                        savedAddresses.push({
                            ...address,
                            id: address?.addressId ?? null,
                            addressName: address?.addressId ?? null,
                            address2: address?.address2 ?? null,
                            country: address.countryCode,
                            state: address.stateCode,
                            zip: address.postalCode,
                            isPrimary: address.preferred,
                            sameAsBilling: false,
                        });
                    });
                }
            }

            let shippingMethodsForBasketResponse, paymentMethodsForBasketResponse;

            try {
                shippingMethodsForBasketResponse =
                    await dataSources.CommerceAPIDataSource.getShippingMethodsForBasket(
                        basketId,
                        shipments[0].shipmentId,
                        siteId,
                        user.accessToken,
                        locale
                    );

                paymentMethodsForBasketResponse =
                    await dataSources.CommerceAPIDataSource.getPaymentMethodsForBasket(
                        basketId,
                        siteId,
                        user.accessToken,
                        locale
                    );
            } catch (err) {
                console.trace(err);
                throw new CommerceError("Error fetching checkout data");
            }

            let paymentMethods = [];
            const deliveryMethods: DeliveryMethod[] = [];

            if (paymentMethodsForBasketResponse?.applicablePaymentMethods.length) {
                paymentMethods = paymentMethodsForBasketResponse?.applicablePaymentMethods.map(
                    (paymentMethod: any) => {
                        return {
                            id: paymentMethod.id,
                            name: paymentMethod.name,
                        };
                    }
                );
            }

            if (shippingMethodsForBasketResponse?.applicableShippingMethods.length) {
                const storeSupportedDeliveryMethods = storeRes.c_deliveryMethods;

                shippingMethodsForBasketResponse?.applicableShippingMethods.forEach((deliveryMethod: any) => {
                    const isSupported = storeSupportedDeliveryMethods.indexOf(deliveryMethod.id) !== -1;

                    if (!isSupported) return;

                    deliveryMethods.push({
                        id: deliveryMethod.id,
                        name: deliveryMethod.name,
                        description: deliveryMethod.description,
                        eta: deliveryMethod.c_estimatedArrivalTime || "",
                        requiresDate: deliveryMethod.c_requiresDate || false,
                        isStorePickup: deliveryMethod.c_storePickupEnabled || false,
                        price: toPrice(deliveryMethod.price, currency).toFormat(),
                    });
                });
            }

            let selectedStoreAddress;

            if (!deliveryMethods.length) {
                throw new CommerceError("Store does not support any delivery methods");
            }

            const checkoutDataResult: CheckoutData = {
                status: "200",
                savedAddresses,
                deliveryMethods: {
                    items: deliveryMethods,
                },
                paymentMethods: {
                    items: paymentMethods,
                },
                dateTimePickerData: dateTimePickerData,
            };

            if (
                storeRes.name &&
                storeRes.address1 &&
                storeRes.country_code &&
                storeRes.city &&
                storeRes.state_code &&
                storeRes.postal_code
            ) {
                selectedStoreAddress = {
                    id: "Primary",
                    addressName: storeRes.name,
                    address1: storeRes.address1,
                    address2: storeRes.address2 || "",
                    countryCode: storeRes.country_code,
                    city: storeRes.city,
                    stateCode: storeRes.state_code,
                    postalCode: storeRes.postal_code,
                    isPrimary: false,
                    sameAsBilling: false,
                };
                checkoutDataResult.selectedStoreAddress = selectedStoreAddress;
            } else {
                checkoutDataResult.status = "500";
            }

            return checkoutDataResult;
        } else {
            return null;
        }
    }

    @Mutation(() => Basket)
    async addShippingMethodToBasket(
        @Arg("siteId") siteId: string,
        @Arg("shippingMethodId") shippingMethodId: string,
        @Ctx()
        {
            dataSources,
            user: { accessToken, customerId },
        }: GraphQLContext & { dataSources: GraphQLDataSources }
    ): Promise<Basket | null> {
        const basketData = await dataSources.CommerceAPIDataSource.getCustomerBaskets(
            siteId,
            accessToken,
            customerId
        );

        if ("baskets" in basketData) {
            const { currency, basketId, shipments } = basketData.baskets[0];

            if (!shipments || !shipments[0]) {
                throw new CommerceError("In seems there is not shipments in basket");
            }

            const modifiedBasketData = await dataSources.CommerceAPIDataSource.addShippingMethodToBasket(
                basketId,
                shipments[0].shipmentId,
                accessToken,
                siteId,
                shippingMethodId
            );

            return {
                ...modifiedBasketData,
                orderTotal: toPrice(modifiedBasketData.orderTotal, currency).toFormat(),
                productSubTotal: toPrice(modifiedBasketData.productSubTotal, currency).toFormat(),
                productItems: modifiedBasketData.productItems.map((productLineItem: any) => {
                    const parsedIngredients =
                        JSON.parse(productLineItem.c_ingredients)?.filter(
                            (ingredient: any) => ingredient.qty > 0
                        ) ?? null;

                    return {
                        ...productLineItem,
                        ingredients: productLineItem.c_ingredients,
                        price: toPrice(productLineItem.priceAfterItemDiscount, currency).toFormat(),
                        minQty: productLineItem.c_minQty,
                        maxQty: productLineItem.c_maxQty,
                        image: productLineItem.c_image,
                        ingredientsString:
                            parsedIngredients
                                ?.map((ingredient: any, index: number) => {
                                    return `${ingredient.name}: ${ingredient.qty}${
                                        index < parsedIngredients.length - 1 ? "," : ""
                                    }`;
                                })
                                ?.join(" ") ?? null,
                    };
                }),
                shippingTotal: toPrice(modifiedBasketData?.shippingTotal ?? 0, currency).toFormat(),
                taxTotal: toPrice(modifiedBasketData?.taxTotal ?? 0, currency).toFormat(),
            };
        }

        throw new CommerceError("Basket does not exist");
    }

    @Mutation(() => Basket)
    async addShippingAddressToBasket(
        @Arg("siteId") siteId: string,
        @Arg("shippingAddress") shippingAddress: OrderAddressInput,
        @Ctx()
        {
            dataSources,
            user: { accessToken, customerId },
        }: GraphQLContext & { dataSources: GraphQLDataSources }
    ): Promise<Basket | null> {
        const basketData = await dataSources.CommerceAPIDataSource.getCustomerBaskets(
            siteId,
            accessToken,
            customerId
        );

        if ("baskets" in basketData) {
            const {
                productItems,
                taxTotal,
                currency,
                shippingTotal,
                orderTotal,
                productSubTotal,
                basketId,
                shipments,
            } = basketData.baskets[0];

            if (!shipments || !shipments[0]) {
                throw new CommerceError("In seems there is not shipments in basket");
            }

            const modifiedBasketData = await dataSources.CommerceAPIDataSource.addShippingAddressToBasket(
                basketId,
                shipments[0].shipmentId,
                accessToken,
                siteId,
                shippingAddress
            );

            return {
                ...modifiedBasketData,
                orderTotal: toPrice(orderTotal, currency).toFormat(),
                taxTotal: toPrice(taxTotal, currency).toFormat(),
                shippingTotal: toPrice(shippingTotal ? shippingTotal : 0, currency).toFormat(),
                productSubTotal: toPrice(productSubTotal, currency).toFormat(),
                productItems: productItems.map((productLineItem: any) => {
                    const parsedIngredients =
                        JSON.parse(productLineItem.c_ingredients)?.filter(
                            (ingredient: any) => ingredient.qty > 0
                        ) ?? null;

                    return {
                        ...productLineItem,
                        ingredients: productLineItem.c_ingredients,
                        price: toPrice(productLineItem.priceAfterItemDiscount, currency).toFormat(),
                        minQty: productLineItem.c_minQty,
                        maxQty: productLineItem.c_maxQty,
                        image: productLineItem.c_image,
                        ingredientsString:
                            parsedIngredients
                                ?.map((ingredient: any, index: number) => {
                                    return `${ingredient.name}: ${ingredient.qty}${
                                        index < parsedIngredients.length - 1 ? "," : ""
                                    }`;
                                })
                                ?.join(" ") ?? null,
                    };
                }),
            };
        }

        throw new CommerceError("Basket does not exist");
    }

    @Mutation(() => Basket)
    async addBillingAddressToBasket(
        @Arg("siteId") siteId: string,
        @Arg("billingAddress") billingAddress: OrderAddressInput,
        @Ctx()
        {
            dataSources,
            user: { accessToken, customerId },
        }: GraphQLContext & { dataSources: GraphQLDataSources }
    ): Promise<Basket | null> {
        const basketData = await dataSources.CommerceAPIDataSource.getCustomerBaskets(
            siteId,
            accessToken,
            customerId
        );

        if ("baskets" in basketData) {
            const { productItems, currency, orderTotal, productSubTotal, basketId } = basketData.baskets[0];

            const modifiedBasketData = await dataSources.CommerceAPIDataSource.addBillingAddressToBasket(
                basketId,
                accessToken,
                siteId,
                billingAddress
            );

            return {
                ...modifiedBasketData,
                shippingTotal: toPrice(modifiedBasketData?.shippingTotal ?? 0, currency).toFormat(),
                taxTotal: toPrice(modifiedBasketData?.taxTotal ?? 0, currency).toFormat(),
                orderTotal: toPrice(orderTotal, currency).toFormat(),
                productSubTotal: toPrice(productSubTotal, currency).toFormat(),
                productItems: productItems.map((productLineItem: any) => {
                    const parsedIngredients =
                        JSON.parse(productLineItem.c_ingredients)?.filter(
                            (ingredient: any) => ingredient.qty > 0
                        ) ?? null;

                    return {
                        ...productLineItem,
                        ingredients: productLineItem.c_ingredients,
                        price: toPrice(productLineItem.priceAfterItemDiscount, currency).toFormat(),
                        minQty: productLineItem.c_minQty,
                        maxQty: productLineItem.c_maxQty,
                        image: productLineItem.c_image,
                        ingredientsString:
                            parsedIngredients
                                ?.map((ingredient: any, index: number) => {
                                    return `${ingredient.name}: ${ingredient.qty}${
                                        index < parsedIngredients.length - 1 ? "," : ""
                                    }`;
                                })
                                ?.join(" ") ?? null,
                    };
                }),
            };
        }

        throw new CommerceError("Basket does not exist");
    }

    @Mutation(() => Basket)
    async addPaymentMethodToBasket(
        @Arg("siteId") siteId: string,
        @Arg("paymentMethodId") paymentMethodId: string,
        @Ctx()
        {
            dataSources,
            user: { accessToken, customerId },
        }: GraphQLContext & { dataSources: GraphQLDataSources }
    ): Promise<Basket | null> {
        const basketData = await dataSources.CommerceAPIDataSource.getCustomerBaskets(
            siteId,
            accessToken,
            customerId
        );

        if ("baskets" in basketData) {
            const { productItems, currency, orderTotal, productSubTotal, basketId } = basketData.baskets[0];

            const modifiedBasketData = await dataSources.CommerceAPIDataSource.addPaymentMethodToBasket(
                basketId,
                accessToken,
                siteId,
                paymentMethodId
            );

            return {
                ...modifiedBasketData,
                orderTotal: toPrice(orderTotal, currency).toFormat(),
                shippingTotal: toPrice(modifiedBasketData?.shippingTotal ?? 0, currency).toFormat(),
                taxTotal: toPrice(modifiedBasketData?.taxTotal ?? 0, currency).toFormat(),
                productSubTotal: toPrice(productSubTotal, currency).toFormat(),
                productItems: productItems.map((productLineItem: any) => {
                    const parsedIngredients =
                        JSON.parse(productLineItem.c_ingredients)?.filter(
                            (ingredient: any) => ingredient.qty > 0
                        ) ?? null;

                    return {
                        ...productLineItem,
                        ingredients: productLineItem.c_ingredients,
                        price: toPrice(productLineItem.priceAfterItemDiscount, currency).toFormat(),
                        minQty: productLineItem.c_minQty,
                        maxQty: productLineItem.c_maxQty,
                        image: productLineItem.c_image,
                        ingredientsString:
                            parsedIngredients
                                ?.map((ingredient: any, index: number) => {
                                    return `${ingredient.name}: ${ingredient.qty}${
                                        index < parsedIngredients.length - 1 ? "," : ""
                                    }`;
                                })
                                ?.join(" ") ?? null,
                    };
                }),
            };
        }

        throw new CommerceError("Basket does not exist");
    }

    @Mutation(() => OrderData)
    async createOrder(
        @Arg("siteId") siteId: string,
        @Arg("storeId") storeId: string,
        @Ctx()
        {
            dataSources,
            user: { accessToken, customerId },
            req,
            res,
        }: GraphQLContext & { dataSources: GraphQLDataSources }
    ): Promise<OrderData | null> {
        const cookies = new Cookies(req, res, {
            keys: [process.env.COOKIES_SIGNATURE_KEY],
            secure: process.env.NODE_ENV !== "development" ? true : false,
        });

        const selectedStoreId = cookies.get("session.selectedStoreId", { signed: true });
        const { name } = await dataSources.ocapi.getStoreById(selectedStoreId as string, siteId, accessToken);

        const basketData = await dataSources.CommerceAPIDataSource.getCustomerBaskets(
            siteId,
            accessToken,
            customerId
        );

        if ("baskets" in basketData) {
            const { basketId } = basketData.baskets[0];

            const order = await dataSources.CommerceAPIDataSource.createOrder(accessToken, siteId, basketId);

            await dataSources.StripeCommerceAPIDataSource.updateOrderStatus(siteId, order.orderNo, "new");

            await dataSources.StripeCommerceAPIDataSource.updateOrder(siteId, order.orderNo, {
                storeId,
                storeName: name,
            });

            return {
                status: order.status,
                orderNo: order.orderNo,
            };
        }

        throw new CommerceError("Basket does not exist");
    }

    @Query(() => OrderConfirmationData)
    async getOrderConfirmationData(
        @Arg("siteId") siteId: string,
        @Arg("locale") locale: string,
        @Arg("orderId") orderId: string,
        @Ctx()
        { dataSources, user: { accessToken } }: GraphQLContext & { dataSources: GraphQLDataSources }
    ) {
        const orderConfirmationData = await dataSources.CommerceAPIDataSource.getOrderConfirmationData(
            accessToken,
            siteId,
            locale,
            orderId
        );

        if (orderConfirmationData && orderConfirmationData.shipments[0]) {
            const result: OrderConfirmationData = {
                orderConfirmationReceipt: {
                    deliveryMethod: {
                        description: orderConfirmationData.shipments[0]?.shippingMethod?.description ?? "",
                        name: orderConfirmationData.shipments[0]?.shippingMethod?.name ?? "",
                        requiresDate:
                            orderConfirmationData.shipments[0]?.shippingMethod?.c_requiresDate ?? false,
                        isStorePickup:
                            orderConfirmationData.shipments[0]?.shippingMethod?.c_storePickupEnabled ?? false,
                        estimatedArrivalTime:
                            orderConfirmationData.shipments[0]?.shippingMethod?.c_estimatedArrivalTime,
                    },
                    orderNumber: orderConfirmationData.orderNo,
                    orderStatus: orderConfirmationData.status,
                    paymentStatus: orderConfirmationData.paymentStatus,
                    phone: orderConfirmationData.shipments[0].shippingAddress.phone,
                    orderDate: orderConfirmationData.creationDate,
                    billingAddress: {
                        address1: orderConfirmationData.billingAddress.address1,
                        address2: orderConfirmationData.billingAddress.address2,
                        city: orderConfirmationData.billingAddress.city,
                        country: orderConfirmationData.billingAddress.countryCode,
                        firstName: orderConfirmationData.billingAddress.firstName,
                        id: orderConfirmationData.billingAddress.address1,
                        fullName: orderConfirmationData.billingAddress.fullName,
                        lastName: orderConfirmationData.billingAddress.lastName,
                        phone: orderConfirmationData.billingAddress.phone,
                        state: orderConfirmationData.billingAddress.address1,
                        zip: orderConfirmationData.billingAddress.address1,
                    },
                    shippingAddress: {
                        address1: orderConfirmationData.shipments[0].shippingAddress.address1,
                        address2: orderConfirmationData.shipments[0].shippingAddress.address2,
                        city: orderConfirmationData.shipments[0].shippingAddress.city,
                        country: orderConfirmationData.shipments[0].shippingAddress.countryCode,
                        firstName: orderConfirmationData.shipments[0].shippingAddress.firstName,
                        id: orderConfirmationData.shipments[0].shippingAddress.address1,
                        fullName: orderConfirmationData.shipments[0].shippingAddress.fullName,
                        lastName: orderConfirmationData.shipments[0].shippingAddress.lastName,
                        phone: orderConfirmationData.shipments[0].shippingAddress.phone,
                        state: orderConfirmationData.shipments[0].shippingAddress.address1,
                        zip: orderConfirmationData.shipments[0].shippingAddress.address1,
                    },
                },
                orderConfirmationSummary: {
                    storeName: orderConfirmationData?.c_storeName ?? "",
                    storeId: orderConfirmationData?.c_storeId ?? "",
                    total: toPrice(
                        orderConfirmationData.orderTotal,
                        orderConfirmationData.currency
                    ).toFormat(),
                    subtotal: toPrice(
                        orderConfirmationData.productSubTotal,
                        orderConfirmationData.currency
                    ).toFormat(),
                    shippingTotal: toPrice(
                        orderConfirmationData?.shippingTotal ?? 0,
                        orderConfirmationData.currency
                    ).toFormat(),
                    taxTotal: toPrice(
                        orderConfirmationData?.taxTotal ?? 0,
                        orderConfirmationData.currency
                    ).toFormat(),
                    orderItems:
                        orderConfirmationData.productItems?.map((productLineItem: any) => {
                            return {
                                ...productLineItem,
                                ingredients: productLineItem.c_ingredients,
                                image: productLineItem.c_image,
                                price: toPrice(
                                    productLineItem.priceAfterItemDiscount,
                                    orderConfirmationData.currency
                                ).toFormat(),
                            };
                        }) ?? [],
                },
            };

            return result;
        }

        throw new CommerceError("Could not fetch order confirmation");
    }

    @Query(() => Order)
    async getOrderStatus(
        @Arg("siteId") siteId: string,
        @Arg("orderNo") orderNo: string,
        @Arg("phoneNumber") phoneNumber: string,
        @Arg("timestamp") timestamp: string,
        @Ctx()
        { dataSources }: GraphQLContext & { dataSources: GraphQLDataSources }
    ) {
        const order = await dataSources.StripeCommerceAPIDataSource.getOrder(siteId, orderNo);
        const orderShipment = order.shipments[0];
        const shippingAddressPhone = orderShipment.shippingAddress.phone;

        if (
            order.orderNo === orderNo &&
            shippingAddressPhone === phoneNumber &&
            order.creationDate === timestamp
        ) {
            return {
                ...order,
                orderTotal: toPrice(order.orderTotal, order.currency).toFormat(),
                shippingTotal: toPrice(order?.shippingTotal ?? 0, order.currency).toFormat(),
                taxTotal: toPrice(order?.taxTotal ?? 0, order.currency).toFormat(),
                productSubTotal: toPrice(order.productSubTotal, order.currency).toFormat(),
                paymentIntentId: order.c_paymentIntentId,
                storeId: order.c_storeId,
                storeName: order.c_storeName,
                productItems: order.productItems.map((productLineItem: any) => {
                    const parsedIngredients =
                        JSON.parse(productLineItem.c_ingredients)?.filter(
                            (ingredient: any) => ingredient.qty > 0
                        ) ?? null;

                    return {
                        ...productLineItem,
                        ingredients: productLineItem.c_ingredients,
                        price: toPrice(productLineItem.priceAfterItemDiscount, order.currency).toFormat(),
                        minQty: productLineItem.c_minQty,
                        maxQty: productLineItem.c_maxQty,
                        image: productLineItem.c_image,
                        ingredientsString:
                            parsedIngredients
                                ?.map((ingredient: any, index: number) => {
                                    return `${ingredient.name}: ${ingredient.qty}${
                                        index < parsedIngredients.length - 1 ? "," : ""
                                    }`;
                                })
                                ?.join(" ") ?? null,
                    };
                }),
            };
        }

        throw new CommerceError("Could not fetch order confirmation");
    }

    @Query(() => Order)
    async getOrder(
        @Arg("siteId") siteId: string,
        @Arg("orderNo") orderNo: string,
        @Ctx()
        { dataSources }: GraphQLContext & { dataSources: GraphQLDataSources }
    ) {
        const data = await dataSources.StripeCommerceAPIDataSource.getOrder(siteId, orderNo);

        return {
            ...data,
            orderTotal: toPrice(data.orderTotal, data.currency).toFormat(),
            shippingTotal: toPrice(data?.shippingTotal ?? 0, data.currency).toFormat(),
            taxTotal: toPrice(data?.taxTotal ?? 0, data.currency).toFormat(),
            productSubTotal: toPrice(data.productSubTotal, data.currency).toFormat(),
            paymentIntentId: data.c_paymentIntentId,
            productItems: data.productItems.map((productLineItem: any) => {
                const parsedIngredients =
                    JSON.parse(productLineItem.c_ingredients)?.filter(
                        (ingredient: any) => ingredient.qty > 0
                    ) ?? null;

                return {
                    ...productLineItem,
                    ingredients: productLineItem.c_ingredients,
                    price: toPrice(productLineItem.priceAfterItemDiscount, data.currency).toFormat(),
                    minQty: productLineItem.c_minQty,
                    maxQty: productLineItem.c_maxQty,
                    image: productLineItem.c_image,
                    ingredientsString:
                        parsedIngredients
                            ?.map((ingredient: any, index: number) => {
                                return `${ingredient.name}: ${ingredient.qty}${
                                    index < parsedIngredients.length - 1 ? "," : ""
                                }`;
                            })
                            ?.join(" ") ?? null,
                };
            }),
        };
    }
}
