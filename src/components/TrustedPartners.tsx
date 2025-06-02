export const TrustedPartners = () => {
  const partners = [
    { name: "Citrus Apps Lab", logo: "/CitrusAppsLab (1).png", link: "https://www.citrusappslab.com/" },
    { name: "FoundersCard", logo: "/founderscard.png", link: "https://founderscard.com/membership?code=FCSTYOPA604" },
    // ... other partners
  ];

  // Helper function to render styled name
  // const renderPartnerName = (name) => {
  //   if (name === "FoundersCard") {
  //     return (
  //       <span>
  //         <span className="font-bold">FOUNDERS</span>
  //         <span className="font-medium">CARD</span>
  //       </span>
  //     );
  //   }
  //   return name;
  // };

  return (
    <section className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-lg font-medium text-black/80 mb-6">Trusted By:</h2>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {partners.map((partner, index) => (
              <a 
                key={index} 
                href={partner.link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-center justify-center items-center flex flex-col transition-all duration-300 hover:opacity-100 hover:scale-105 min-w-[120px]"
              >
                {partner.logo ? (
                  <>
                    <img
                      src={partner.logo}
                      alt={`${partner.name} logo`}
                      className="h-16 bright"
                      loading="lazy"
                    />
                    <span className="block text-md text-black/80 mt-2">
                      {partner.name}
                    </span>
                  </>
                ) : (
                  <div className="h-16 flex items-center justify-center">
                    <span className="text-xl text-gray-800">
                      {partner.name}
                    </span>
                  </div>
                )}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};