import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: [
                "/admin/",
                "/api/",
                "/checkout/",
                "/settings/",
                "/checkout/success",
                "/checkout/failure"
            ],
        },
        sitemap: "https://blactify.com/sitemap.xml",
        host: "https://blactify.com"
    };
}
