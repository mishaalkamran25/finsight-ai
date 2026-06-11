import pandas as pd
import numpy as np
import io
from typing import Optional

COLUMN_ALIASES = {
    "account": ["account", "line item", "description", "name", "item", "category name", "gl account"],
    "category": ["category", "type", "group", "section", "class"],
    "month": ["month", "period", "date", "time period", "fiscal period", "fiscal month"],
    "actual": ["actual", "actuals", "actual amount", "ytd actual", "amount"],
    "budget": ["budget", "budgeted", "plan", "planned", "target"],
    "prior_period": ["prior period", "prior", "prior year", "py", "last year", "previous period", "prior month"],
    "forecast": ["forecast", "fcst", "latest estimate", "le", "updated forecast"],
}

def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    rename_map = {}
    lower_cols = {c.lower().strip(): c for c in df.columns}
    for standard, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            if alias in lower_cols:
                rename_map[lower_cols[alias]] = standard
                break
    df = df.rename(columns=rename_map)
    return df

def parse_file(content: bytes, filename: str) -> pd.DataFrame:
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(content))
        else:
            raise ValueError("Unsupported file type. Please upload CSV or Excel.")
    except Exception as e:
        raise ValueError(f"Could not parse file: {str(e)}")

    df = normalize_columns(df)
    df.columns = [c.lower().strip() for c in df.columns]

    for col in ["actual", "budget", "prior_period", "forecast"]:
        if col in df.columns:
            df[col] = pd.to_numeric(
                df[col].astype(str).str.replace(r"[$,\s]", "", regex=True),
                errors="coerce"
            )

    df = df.dropna(how="all")
    return df

def make_json_safe(obj):
    if isinstance(obj, dict):
        return {k: make_json_safe(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [make_json_safe(v) for v in obj]
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return float(obj)
    if pd.isna(obj):
        return None
    return obj

def compute_metrics(df: pd.DataFrame) -> dict:
    metrics = {}
    has_budget = "budget" in df.columns
    has_prior = "prior_period" in df.columns
    has_month = "month" in df.columns
    has_account = "account" in df.columns
    has_category = "category" in df.columns

    numeric_cols = ["actual", "budget", "prior_period", "forecast"]
    agg_cols = {c: "sum" for c in numeric_cols if c in df.columns}

    if has_account:
        account_totals = df.groupby("account").agg(agg_cols).reset_index()
    else:
        account_totals = df.copy()

    if has_budget and "actual" in df.columns:
        account_totals["variance_vs_budget"] = account_totals["actual"] - account_totals["budget"]
        account_totals["variance_pct_budget"] = (
            account_totals["variance_vs_budget"] / account_totals["budget"].replace(0, np.nan) * 100
        ).round(1)

    if has_prior and "actual" in df.columns:
        account_totals["variance_vs_prior"] = account_totals["actual"] - account_totals["prior_period"]
        account_totals["variance_pct_prior"] = (
            account_totals["variance_vs_prior"] / account_totals["prior_period"].replace(0, np.nan) * 100
        ).round(1)

    metrics["account_totals"] = account_totals.fillna(0).to_dict(orient="records")

    if has_category:
        cat_totals = df.groupby("category").agg(agg_cols).reset_index()
        if has_budget:
            cat_totals["variance_vs_budget"] = cat_totals["actual"] - cat_totals["budget"]
        metrics["category_totals"] = cat_totals.fillna(0).to_dict(orient="records")

    if has_month and "actual" in df.columns:
        month_totals = df.groupby("month").agg(agg_cols).reset_index()
        metrics["monthly_trend"] = month_totals.fillna(0).to_dict(orient="records")

    total_actual = df["actual"].sum() if "actual" in df.columns else None
    total_budget = df["budget"].sum() if "budget" in df.columns else None
    total_prior = df["prior_period"].sum() if "prior_period" in df.columns else None

    metrics["summary"] = {
        "total_actual": round(total_actual, 0) if total_actual is not None else None,
        "total_budget": round(total_budget, 0) if total_budget is not None else None,
        "total_prior": round(total_prior, 0) if total_prior is not None else None,
        "total_variance_vs_budget": round(total_actual - total_budget, 0) if total_actual and total_budget else None,
        "total_variance_pct": round((total_actual - total_budget) / total_budget * 100, 1) if total_actual and total_budget else None,
        "columns_detected": list(df.columns),
        "row_count": len(df),
        "has_budget": has_budget,
        "has_prior": has_prior,
        "has_month": has_month,
        "has_category": has_category,
    }

    if "variance_vs_budget" in account_totals.columns:
        sorted_var = account_totals.sort_values("variance_vs_budget")
        metrics["top_unfavorable"] = sorted_var.head(5).fillna(0).to_dict(orient="records")
        metrics["top_favorable"] = sorted_var.tail(5).fillna(0).to_dict(orient="records")

    return make_json_safe(metrics)

def build_context_string(df: pd.DataFrame, metrics: dict) -> str:
    lines = ["FINANCIAL DATA SUMMARY\n"]
    s = metrics.get("summary", {})

    if s.get("total_actual") is not None:
        lines.append(f"Total Actual: ${s['total_actual']:,.0f}")
    if s.get("total_budget") is not None:
        lines.append(f"Total Budget: ${s['total_budget']:,.0f}")
    if s.get("total_variance_vs_budget") is not None:
        lines.append(f"Total Variance vs Budget: ${s['total_variance_vs_budget']:,.0f} ({s['total_variance_pct']}%)")
    if s.get("total_prior") is not None:
        lines.append(f"Total Prior Period: ${s['total_prior']:,.0f}")

    lines.append("\nACCOUNT-LEVEL DETAIL:")
    for row in metrics.get("account_totals", []):
        line = f"  {row.get('account', row.get('category', 'N/A'))}: Actual ${row.get('actual', 0):,.0f}"
        if row.get("budget"):
            line += f" | Budget ${row['budget']:,.0f}"
        if row.get("variance_vs_budget") is not None:
            line += f" | Var ${row['variance_vs_budget']:,.0f} ({row.get('variance_pct_budget', 0)}%)"
        lines.append(line)

    if metrics.get("top_unfavorable"):
        lines.append("\nTOP UNFAVORABLE VARIANCES:")
        for row in metrics["top_unfavorable"]:
            lines.append(f"  {row.get('account', 'N/A')}: ${row.get('variance_vs_budget', 0):,.0f}")

    if metrics.get("top_favorable"):
        lines.append("\nTOP FAVORABLE VARIANCES:")
        for row in metrics["top_favorable"]:
            lines.append(f"  {row.get('account', 'N/A')}: ${row.get('variance_vs_budget', 0):,.0f}")

    return "\n".join(lines)
