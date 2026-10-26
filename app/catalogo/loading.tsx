import { Container } from "@/components/site/container";

export default function CatalogLoading() {
  return (
    <Container className="pb-14 pt-6 md:pb-[104px] md:pt-12" aria-busy="true">
      <div className="h-4 w-40 bg-hs-placeholder" />
      <div className="mt-4 h-[48px] w-64 bg-hs-placeholder md:h-[64px]" />
      <div className="mt-4 h-12 max-w-[560px] bg-hs-placeholder" />
      <div className="mt-8 h-[70px] border-y border-hs-border" />
      <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-6 md:mt-8 md:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] md:gap-x-6 md:gap-y-10">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-4">
            <div className="aspect-[4/5] w-full bg-hs-placeholder" />
            <div className="h-4 w-1/3 bg-hs-placeholder" />
            <div className="h-5 w-2/3 bg-hs-placeholder" />
          </div>
        ))}
      </div>
    </Container>
  );
}
