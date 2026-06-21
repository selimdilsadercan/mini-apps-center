import { NextRequest, NextResponse } from "next/server";
import { getEncoreProxyTarget } from "@/lib/encore-proxy";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

async function proxyToEncore(request: NextRequest, context: RouteContext) {
  const { path = [] } = await context.params;
  const target = getEncoreProxyTarget();
  const upstreamPath = path.map(encodeURIComponent).join("/");
  const url = new URL(`${target}/${upstreamPath}`);
  url.search = request.nextUrl.search;

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const appVersion = request.headers.get("x-app-version");
  if (appVersion) headers.set("x-app-version", appVersion);
  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("authorization", authorization);

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const body = hasBody ? await request.arrayBuffer() : undefined;

  const upstream = await fetch(url, {
    method: request.method,
    headers,
    body,
    cache: "no-store",
  });

  const responseHeaders = new Headers();
  const upstreamContentType = upstream.headers.get("content-type");
  if (upstreamContentType) {
    responseHeaders.set("content-type", upstreamContentType);
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyToEncore(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyToEncore(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxyToEncore(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyToEncore(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyToEncore(request, context);
}

export async function OPTIONS(request: NextRequest, context: RouteContext) {
  return proxyToEncore(request, context);
}
