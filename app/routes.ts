import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/_index.tsx'),
  route('inpainting', 'routes/inpainting.tsx'),
  route('resize', 'routes/resize.tsx'),
  route('crop', 'routes/crop.tsx'),
  route('convert', 'routes/convert.tsx'),
] satisfies RouteConfig
