"use client";

import StageCanvas from "../LedgerFlow/StageCanvas";

export default function PostingCanvas({ state }) {
  return <StageCanvas state={state} reconcileSublabel="EOD period close" />;
}
