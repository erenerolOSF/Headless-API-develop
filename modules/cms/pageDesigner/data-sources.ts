import { DataSource } from "apollo-datasource";

export class PageDesignerCMSDataSource extends DataSource {
    constructor() {
        super();
    }

    getPDPageById(id: string, siteId: string, locale: string) {
        console.log("getting PD page", id, siteId, locale);
        return {
            components: [
                {
                    component: "ContentImgCta",
                    type: "overflowBottom",
                    alignment: "right",
                    enableTopMargin: true,
                    link: `/storelocator`,
                    img: "/images/image1.png",
                    btnText: "Find a restaurant",
                    description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
                    title: `We're always close by`,
                    subtitle: `Pickup and delivery`,
                    fullWidth: false,
                },
                {
                    component: "ContentImgCta",
                    type: "noOverflowWithBackground",
                    alignment: "left",
                    enableTopMargin: true,
                    link: `/`,
                    img: "/images/image1.png",
                    btnText: "About US",
                    description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
                    title: `Your Restaurant Title`,
                    subtitle: `Awesome story`,
                    fullWidth: false,
                },
            ],
        };
    }
}
