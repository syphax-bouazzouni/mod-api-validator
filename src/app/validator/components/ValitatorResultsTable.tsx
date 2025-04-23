import * as React from "react"
import {useMemo} from "react"
import {ArrowDown, ArrowUp } from "lucide-react"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table"
import {
    Checker, ShowExists,
    ShowExpectedType,
    ShowJsonLDCheck,
    ShowPaginationCheck,
    ShowPropertiesResult, ShowScore
} from "@/app/validator/components/ModAPIValidatorResults";

import {EndpointValidationResult} from "@/lib/api-fetcher";
import {
    Column,
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import ApiTestResultDetail from "@/app/validator/components/ApiTestResutDetail";

function sortableColumn(text: string, column: Column<any>) {
    if (!column) {
        return text;
    }

    const sortIcon = (col: Column<any>) => {
        const asc = col.getIsSorted() === "asc";
        const desc = col.getIsSorted() === "desc";
        if (asc) {
            return <ArrowUp className="ml-2 h-4 w-4"/>
        } else if (desc) {
            return <ArrowDown className="ml-2 h-4 w-4"/>
        }
    }


    return <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        {text}
        {sortIcon(column)}
    </Button>

}

function tableColumns(baseUrl: string): ColumnDef<EndpointValidationResult>[] {
    return [
        {
            accessorKey: "path",
            header: (col) => sortableColumn("Path", col.column),
            cell: ({row}) => (
                <Button variant="link">
                    <a href={baseUrl + row.original.path} target="_blank">
                        <p className="font-medium truncate max-w-[400px]">{row.original.path}</p>
                    </a>
                </Button>
            ),
        },
        {
            accessorKey: "exists",
            header: (col) => sortableColumn("Exist (Level 1)", col.column),
            cell: ({row}) => <ShowExists endpoint={row.original}/>,
            sortingFn: (rowA, rowB, columnId) => {
              const valueA = rowA.original.checks.exists ? "true" : "false";
              const valueB = rowB.original.checks.exists ? "true" : "false";
              return valueA.localeCompare(valueB);
        },
        },
        {
            accessorKey: "type",
            header:
                "Good @type (Level 2)",
            cell: ({row}) => <ShowExpectedType endpoint={row.original}/>,
        }
        ,
        {
            accessorKey: "properties",
            header:
                "Properties (Level 3-4)",
            cell: ({row}) => <ShowPropertiesResult endpoint={row.original}/>,
        }
        ,
        {
            accessorKey: "jsonld",
            header:
                "Valid JSON-LD",
            cell: ({row}) => <ShowJsonLDCheck endpoint={row.original}/>,
        }
        ,
        {
            accessorKey: "paginated",
            header: "Paginated",
            cell: ({row}) => (row.original.expectedModel?.list && <ShowPaginationCheck endpoint={row.original}/>)
        },
        {
            id: "score",
            header: "Score",
            cell: ({row}) => <ShowScore endpoint={row.original}/>
        },
        {
            id: "actions",
            header: "See JSON",
            cell: ({row}) => <ApiTestResultDetail path={row.original.path} result={row.original}/>
        }
    ]
}

export function ValidatorResultsTable({results, baseUrl}: {
    results: Record<string, EndpointValidationResult>,
    baseUrl: string
}) {
    const columns: ColumnDef<EndpointValidationResult>[] = useMemo(() => tableColumns(baseUrl), [baseUrl])

    const data: any = useMemo(() =>
            Object.entries(results).map(([path, endpoint]) => ({
                ...endpoint,
                checks: endpoint.checks,
                path,
            }))
        , [results]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        enableSorting: true,
    })

    return (
        <div className="w-full">
            <div className="flex items-center py-4">
                <Input
                    placeholder="Filter paths..."
                    value={(table.getColumn("path")?.getFilterValue() as string) ?? ""}
                    onChange={(event) => table.getColumn("path")?.setFilterValue(event.target.value)}
                    className="max-w-sm"
                />
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        onClick={() => header.column.getToggleSortingHandler()}
                                    >
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
