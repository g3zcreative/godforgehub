import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbSegment {
  label: string;
  href?: string;
}

interface DatabaseBreadcrumbProps {
  segments: BreadcrumbSegment[];
}

export function DatabaseBreadcrumb({ segments }: DatabaseBreadcrumbProps) {
  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/database">Database</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {segments.map((segment, i) => (
          <span key={i} className="contents">
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {segment.href ? (
                <BreadcrumbLink asChild>
                  <Link to={segment.href}>{segment.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{segment.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
