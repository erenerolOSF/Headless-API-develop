const CMSTranslator = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getContentById: (contentId: string, siteId: string, locale: string, dataSource: any) => {
        //here you must post process real data coming from CMS and format it to match FD needs
        return dataSource.getPDPageById(contentId, siteId, locale);
    },
};

export default CMSTranslator;
