import Feed from "../components/Social/Feed";
import Forum from "../components/Social/Forum";

const Social = () => {
  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 pt-24 min-h-screen w-full">
      <div className="mb-10 border-b border-[#334155] pb-6 text-center lg:text-left lg:ml-12">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#8ab4f8] to-[#c58af9]">
          Community Hub
        </h1>
        <p className="text-[#9aa0a6] mt-2">
          Share updates, connect with gamers, and join discussions.
        </p>
      </div>

      {/* חלוקה ל-12 עמודות - הפיד מקבל 7 באמצע, הפורום מקבל 4 בצד */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* פיד במרכז */}
        <section className="lg:col-start-2 lg:col-span-7 space-y-4">
          <Feed />
        </section>

        {/* פורום בצד ימין (מצומצם יותר) */}
        <section className="lg:col-span-4 space-y-4 hidden lg:block">
          <div className="sticky top-28">
            <Forum />
          </div>
        </section>

        {/* במובייל - הפורום יופיע למטה */}
        <section className="lg:hidden space-y-4 mt-10">
          <Forum />
        </section>
      </div>
    </div>
  );
};

export default Social;