import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { RegionVisualProfile } from "@first-cause/simulation";
import { FCRegionVignette } from "./FCRegionVignette.js";

function buildProfile(overrides?: Partial<RegionVisualProfile>): RegionVisualProfile {
  return {
    regionId: "region_a",
    terrain: "plains",
    water: "none",
    vegetation: "none",
    settlement: undefined,
    industry: undefined,
    transport: undefined,
    energy: undefined,
    landmarkResourceDefinitionId: undefined,
    vignetteSeed: 42,
    ...overrides,
  };
}

describe("FCRegionVignette", () => {
  it("renders at the SS18.2 hover/selected reference dimensions", () => {
    const { container: small } = render(
      <FCRegionVignette profile={buildProfile()} size="small" />,
    );
    expect(small.querySelector("svg")).toHaveAttribute("viewBox", "0 0 120 70");

    const { container: large } = render(
      <FCRegionVignette profile={buildProfile()} size="large" />,
    );
    expect(large.querySelector("svg")).toHaveAttribute("viewBox", "0 0 400 120");
  });

  it("exposes an accessible label listing only the profile's real, defined layers", () => {
    render(
      <FCRegionVignette
        profile={buildProfile({
          terrain: "mountains",
          settlement: "TOWN",
          industry: "mine",
          landmarkResourceDefinitionId: "iron_ore",
        })}
      />,
    );

    const image = screen.getByRole("img");
    expect(image.getAttribute("aria-label")).toContain("terrain: mountains");
    expect(image.getAttribute("aria-label")).toContain("settlement: TOWN");
    expect(image.getAttribute("aria-label")).toContain("industry: mine");
    expect(image.getAttribute("aria-label")).toContain("landmark: iron_ore");
    expect(image.getAttribute("aria-label")).not.toContain("transport");
  });

  it("NO DECORATION WITHOUT INFORMATION: renders no settlement/transport/industry/landmark marks when the profile has none", () => {
    const { container } = render(<FCRegionVignette profile={buildProfile()} />);

    expect(container.querySelectorAll(".fc-region-vignette__mark--settlement")).toHaveLength(0);
    expect(container.querySelectorAll(".fc-region-vignette__mark--transport")).toHaveLength(0);
    expect(container.querySelectorAll(".fc-region-vignette__mark--industry")).toHaveLength(0);
    expect(container.querySelectorAll(".fc-region-vignette__mark--landmark")).toHaveLength(0);
  });

  it("renders a settlement mark per tier, scaling with the settlement stage", () => {
    const { container: town } = render(
      <FCRegionVignette profile={buildProfile({ settlement: "TOWN" })} />,
    );
    const { container: metropolis } = render(
      <FCRegionVignette profile={buildProfile({ settlement: "METROPOLIS" })} />,
    );

    expect(
      town.querySelectorAll(".fc-region-vignette__mark--settlement").length,
    ).toBe(3);
    expect(
      metropolis.querySelectorAll(".fc-region-vignette__mark--settlement").length,
    ).toBe(5);
  });

  it("is deterministic: the same profile renders identical markup on every render (SS18.6/SS13.2)", () => {
    const profile = buildProfile({
      terrain: "hills",
      vegetation: "dense_forest",
      settlement: "CITY",
      transport: "railway",
      industry: "factory",
      landmarkResourceDefinitionId: "coal",
    });

    const { container: first } = render(<FCRegionVignette profile={profile} />);
    const { container: second } = render(<FCRegionVignette profile={profile} />);

    expect(first.innerHTML).toBe(second.innerHTML);
  });
});
