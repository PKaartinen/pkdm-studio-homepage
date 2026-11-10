import type { Media } from "@/data/projects";
import { BrowserFrame, PhoneFrame } from "./Frames";
import { FlowDiagram, Pipeline } from "./Diagrams";
import PhoneVideo from "./PhoneVideo";

/** Renders one case-study chapter's visual block. */
export default function ChapterMedia({
  media,
  accent,
}: {
  media: Media;
  accent: string;
}) {
  switch (media.type) {
    case "browser":
      return <BrowserFrame url={media.url} shot={media.shot} />;

    case "duo":
      return (
        <div className="relative pb-[18%] pr-[10%]">
          <BrowserFrame url={media.url} shot={media.back} className="opacity-90" />
          <div className="absolute bottom-0 right-0 w-[78%] transition-transform duration-700 hover:-translate-y-2">
            <BrowserFrame url={media.url} shot={media.front} />
          </div>
        </div>
      );

    case "device":
      return (
        <div className="relative pb-[8%] pr-[12%]">
          <BrowserFrame url={media.url} shot={media.desktop} />
          <div className="absolute bottom-0 right-0 w-[26%] min-w-[96px] transition-transform duration-700 hover:-translate-y-2">
            <PhoneFrame shot={media.mobile} sizes="200px" />
          </div>
        </div>
      );

    case "phones":
      return (
        <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:snap-none sm:overflow-visible sm:px-0 sm:pb-0"
          style={{ gridTemplateColumns: `repeat(${media.shots.length}, minmax(0, 1fr))` }}
        >
          {media.shots.map((s, i) => (
            <figure
              key={s.src}
              className={`w-[62%] shrink-0 snap-center sm:w-auto ${
                i % 2 === 1 ? "sm:translate-y-8" : ""
              }`}
            >
              <PhoneFrame shot={s} sizes="(max-width: 640px) 62vw, 260px" />
              {s.caption && (
                <figcaption className="mt-3 text-center text-xs text-haze">
                  {s.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      );

    case "phoneVideo":
      return <PhoneVideo src={media.src} poster={media.poster} label={media.label} />;

    case "pipeline":
      return <Pipeline steps={media.steps} accent={accent} />;

    case "flow":
      return (
        <FlowDiagram
          columns={media.columns}
          footnote={media.footnote}
          accent={accent}
        />
      );
  }
}
